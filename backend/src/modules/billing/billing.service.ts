import { BadRequestException, Injectable } from '@nestjs/common';
import { InvoiceStatus, VisitStatus } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

const EXAMINATION_FEE = 100000;

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  async createInvoiceFromVisit(visitId: string) {
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        invoice: true,
        examination: {
          include: {
            prescription: {
              include: {
                items: {
                  include: {
                    drug: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!visit) {
      throw new BadRequestException('Visit not found');
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

    const invoiceItems = [
      {
        description: 'Phí khám bệnh',
        quantity: 1,
        unitPrice: EXAMINATION_FEE,
        lineTotal: EXAMINATION_FEE,
      },
    ];

    const prescriptionItems = visit.examination.prescription?.items || [];

    for (const item of prescriptionItems) {
      invoiceItems.push({
        description: `Thuốc: ${item.drug.name} - ${item.dosage}`,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.lineTotal),
      });
    }

    const totalAmount = invoiceItems.reduce(
      (sum, item) => sum + Number(item.lineTotal),
      0,
    );

    const invoice = await this.prisma.invoice.create({
      data: {
        visitId,
        totalAmount,
        paidAmount: 0,
        status: InvoiceStatus.UNPAID,
        items: {
          create: invoiceItems,
        },
      },
      include: {
        items: true,
        payments: true,
      },
    });

    return invoice;
  }

  async findInvoice(id: string) {
    return this.prisma.invoice.findUniqueOrThrow({
      where: { id },
      include: {
        visit: {
          include: {
            patient: true,
          },
        },
        items: true,
        payments: true,
      },
    });
  }

  async createPayment(invoiceId: string, dto: CreatePaymentDto) {
    if (dto.amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than 0');
    }

    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
      });

      if (!invoice) {
        throw new BadRequestException('Invoice not found');
      }

      if (invoice.status === InvoiceStatus.CANCELLED) {
        throw new BadRequestException('Cannot pay cancelled invoice');
      }

      if (invoice.status === InvoiceStatus.PAID) {
        throw new BadRequestException('Invoice is already paid');
      }

      const totalAmount = Number(invoice.totalAmount);
      const paidAmount = Number(invoice.paidAmount);
      const remainingAmount = totalAmount - paidAmount;

      if (dto.amount > remainingAmount) {
        throw new BadRequestException(
          'Payment amount exceeds remaining amount',
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

      let newStatus: InvoiceStatus = InvoiceStatus.PARTIALLY_PAID;

      if (newPaidAmount === totalAmount) {
        newStatus = InvoiceStatus.PAID;
      }

      return tx.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
        },
        include: {
          items: true,
          payments: true,
        },
      });
    });
  }
}
