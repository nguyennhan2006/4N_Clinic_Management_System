import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InvoiceStatus, Prisma, VisitStatus } from '@prisma/client';

import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { QueryInvoicesDto } from './dto/query-invoices.dto';

const DEFAULT_CONSULTATION_FEE = 150000;

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private async getConsultationFee(): Promise<number> {
    const activeVersion = await this.prisma.regulationVersion.findFirst({
      where: { isActive: true },
      include: { items: true },
    });
    const item = activeVersion?.items.find((i) => i.key === 'CONSULTATION_FEE');
    const parsed = item ? Number(item.value) : NaN;
    return Number.isFinite(parsed) && parsed > 0
      ? parsed
      : DEFAULT_CONSULTATION_FEE;
  }

  // UC-14: Lập hóa đơn từ visit đã COMPLETED — multi-item invoice
  async createInvoiceFromVisit(visitId: string, actorId: string) {
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        invoice: true,
        examination: {
          include: {
            prescription: {
              include: { items: { include: { drug: true } } },
            },
          },
        },
        serviceOrders: {
          where: { status: 'COMPLETED' },
          include: { service: true },
        },
      },
    });

    if (!visit) {
      throw new NotFoundException('Visit not found');
    }

    if (visit.status !== VisitStatus.COMPLETED) {
      throw new BadRequestException(
        'Only COMPLETED visit can be converted to invoice',
      );
    }

    if (visit.invoice) {
      return this.findInvoice(visit.invoice.id);
    }

    if (!visit.examination) {
      throw new BadRequestException('Visit has no examination');
    }

    const consultationFee = await this.getConsultationFee();

    const invoiceItems: {
      description: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
      itemType?: string;
      referenceType?: string;
      referenceId?: string;
    }[] = [
      {
        description: 'Phí khám bệnh',
        quantity: 1,
        unitPrice: consultationFee,
        lineTotal: consultationFee,
        itemType: 'CONSULTATION',
        referenceType: 'Examination',
        referenceId: visit.examination.id,
      },
    ];

    // Dịch vụ đã hoàn thành (service orders COMPLETED)
    for (const order of visit.serviceOrders ?? []) {
      invoiceItems.push({
        description: order.service.name,
        quantity: 1,
        unitPrice: Number(order.priceSnapshot),
        lineTotal: Number(order.priceSnapshot),
        itemType: 'SERVICE',
        referenceType: 'ServiceOrder',
        referenceId: order.id,
      });
    }

    // Thuốc trong đơn kê
    for (const item of visit.examination.prescription?.items ?? []) {
      invoiceItems.push({
        description: `Thuốc: ${item.drug.name} - ${item.dosage}`,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.lineTotal),
        itemType: 'DRUG',
        referenceType: 'PrescriptionItem',
        referenceId: item.id,
      });
    }

    const totalAmount = invoiceItems.reduce((sum, i) => sum + i.lineTotal, 0);

    const invoice = await this.prisma.invoice.create({
      data: {
        visitId,
        totalAmount,
        paidAmount: 0,
        status: InvoiceStatus.ISSUED,
        items: { create: invoiceItems },
      },
      include: {
        items: true,
        payments: true,
        visit: { include: { patient: true } },
      },
    });

    await this.auditService.log({
      actorId,
      action: 'CREATE_INVOICE',
      entityType: 'Invoice',
      entityId: invoice.id,
      after: { visitId, totalAmount, itemCount: invoiceItems.length },
    });

    return invoice;
  }

  async getInvoiceItems(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    return this.prisma.invoiceItem.findMany({
      where: { invoiceId },
      orderBy: [{ itemType: 'asc' }, { description: 'asc' }],
    });
  }

  // UC-16: Tra cứu danh sách hóa đơn
  async findMany(query: QueryInvoicesDto) {
    const where: Prisma.InvoiceWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.date) {
      const day = new Date(`${query.date}T00:00:00.000Z`);
      const next = new Date(day);
      next.setUTCDate(next.getUTCDate() + 1);
      where.createdAt = { gte: day, lt: next };
    }

    if (query.keyword) {
      const kw = query.keyword;
      where.visit = {
        patient: {
          OR: [
            { fullName: { contains: kw, mode: 'insensitive' } },
            { patientCode: { contains: kw, mode: 'insensitive' } },
            { phone: { contains: kw } },
          ],
        },
      };
    }

    return this.prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        status: true,
        totalAmount: true,
        paidAmount: true,
        createdAt: true,
        visit: {
          select: {
            id: true,
            visitDate: true,
            patient: {
              select: {
                id: true,
                patientCode: true,
                fullName: true,
                phone: true,
              },
            },
          },
        },
      },
    });
  }

  // UC-16: Xem chi tiết hóa đơn
  async findInvoice(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        visit: { include: { patient: true } },
        items: true,
        payments: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  // UC-15: Ghi nhận thanh toán
  async createPayment(
    invoiceId: string,
    dto: CreatePaymentDto,
    actorId: string,
  ) {
    if (dto.amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than 0');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
      });

      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      if (invoice.status === InvoiceStatus.VOID) {
        throw new BadRequestException('Cannot pay voided invoice');
      }

      if (invoice.status === InvoiceStatus.PAID) {
        throw new BadRequestException('Invoice is already paid');
      }

      const totalAmount = Number(invoice.totalAmount);
      const paidAmount = Number(invoice.paidAmount);
      const remainingAmount = totalAmount - paidAmount;

      if (dto.amount > remainingAmount) {
        throw new BadRequestException(
          `Payment amount (${dto.amount}) exceeds remaining amount (${remainingAmount})`,
        );
      }

      await tx.payment.create({
        data: {
          invoiceId,
          amount: dto.amount,
          method: dto.method,
          note: dto.note,
        },
      });

      const newPaidAmount = paidAmount + dto.amount;
      const newStatus =
        newPaidAmount >= totalAmount
          ? InvoiceStatus.PAID
          : InvoiceStatus.PARTIALLY_PAID;

      return tx.invoice.update({
        where: { id: invoiceId },
        data: { paidAmount: newPaidAmount, status: newStatus },
        include: { items: true, payments: true },
      });
    });

    await this.auditService.log({
      actorId,
      action: 'CREATE_PAYMENT',
      entityType: 'Invoice',
      entityId: invoiceId,
      after: {
        amount: dto.amount,
        method: dto.method,
        newStatus: updated.status,
      },
    });

    return updated;
  }
}
