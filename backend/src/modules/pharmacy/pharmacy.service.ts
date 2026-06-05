import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DispenseStatus } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateDispenseDto, QueryDispenseDto } from './dto/create-dispense.dto';

@Injectable()
export class PharmacyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getWorklist(date?: string) {
    const day = date ? new Date(date) : new Date();
    day.setHours(0, 0, 0, 0);
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);

    // Đơn thuốc PENDING (chưa phát) trong ngày
    return this.prisma.prescription.findMany({
      where: {
        dispense: null, // chưa có dispense
        examination: {
          visit: {
            visitDate: { gte: day, lt: nextDay },
          },
        },
      },
      include: {
        examination: {
          include: {
            visit: {
              include: {
                patient: { select: { id: true, fullName: true, phone: true } },
              },
            },
            doctor: { select: { fullName: true } },
          },
        },
        items: {
          include: { drug: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async dispense(dto: CreateDispenseDto, actorId: string) {
    // 1. Validate prescription tồn tại
    const prescription = await this.prisma.prescription.findUnique({
      where: { id: dto.prescriptionId },
      include: {
        items: { include: { drug: true } },
        examination: { include: { visit: true } },
      },
    });
    if (!prescription) throw new NotFoundException('Prescription not found');

    // 2. BR-PHR-02: Mỗi prescription chỉ phát 1 lần
    const existingDispense = await this.prisma.dispense.findFirst({
      where: {
        prescriptionId: dto.prescriptionId,
        status: { not: DispenseStatus.CANCELLED },
      },
    });
    if (existingDispense) {
      throw new ConflictException('Prescription has already been dispensed');
    }

    // 3. Validate từng item
    for (const item of dto.items) {
      const prescItem = prescription.items.find((p) => p.id === item.prescriptionItemId);
      if (!prescItem) {
        throw new NotFoundException(
          `PrescriptionItem ${item.prescriptionItemId} not found in prescription`,
        );
      }

      // BR-PHR-03: Số lượng phát không vượt quá số kê đơn
      if (item.quantity > prescItem.quantity) {
        throw new BadRequestException(
          `Cannot dispense ${item.quantity} of "${prescItem.drug.name}": prescribed quantity is ${prescItem.quantity}`,
        );
      }

      // BR-PHR-04: Kiểm tra tồn kho trước khi phát
      const lot = await this.prisma.stockLot.findUnique({ where: { id: item.stockLotId } });
      if (!lot) throw new NotFoundException(`StockLot ${item.stockLotId} not found`);
      if (lot.drugId !== prescItem.drugId) {
        throw new BadRequestException(
          `StockLot ${lot.id} is for a different drug than prescribed`,
        );
      }
      if (lot.quantityOnHand < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock in lot ${lot.lotNumber}: need ${item.quantity}, have ${lot.quantityOnHand}`,
        );
      }

      // Kiểm tra lô không hết hạn
      if (lot.expiryDate < new Date()) {
        throw new BadRequestException(
          `Lot ${lot.lotNumber} has expired (${lot.expiryDate.toISOString().split('T')[0]})`,
        );
      }
    }

    // 4. Atomic transaction: tạo Dispense + trừ kho + ghi movement
    return this.prisma.$transaction(async (tx) => {
      // Tạo Dispense với items
      const dispense = await tx.dispense.create({
        data: {
          prescriptionId: dto.prescriptionId,
          visitId: dto.visitId,
          dispensedById: actorId,
          status: DispenseStatus.DISPENSED,
          dispensedAt: new Date(),
          note: dto.note ?? null,
          items: {
            create: dto.items.map((item) => {
              const prescItem = prescription.items.find((p) => p.id === item.prescriptionItemId)!;
              return {
                prescriptionItemId: item.prescriptionItemId,
                drugId: prescItem.drugId,
                lotId: item.stockLotId,
                quantity: item.quantity,
                unitPriceSnapshot: prescItem.unitPrice,
              };
            }),
          },
        },
        include: {
          items: {
            include: {
              drug: true,
              lot: { select: { lotNumber: true, expiryDate: true } },
            },
          },
        },
      });

      // BR-PHR-05: Trừ kho và ghi StockMovement type=OUT
      for (const item of dto.items) {
        await tx.stockLot.update({
          where: { id: item.stockLotId },
          data: { quantityOnHand: { decrement: item.quantity } },
        });

        const prescItem = prescription.items.find((p) => p.id === item.prescriptionItemId)!;
        await tx.stockMovement.create({
          data: {
            drugId: prescItem.drugId,
            lotId: item.stockLotId,
            movementType: 'OUT',
            quantity: item.quantity,
            referenceType: 'DISPENSE',
            referenceId: dispense.id,
            note: `Phát thuốc đơn ${dto.prescriptionId}`,
            createdById: actorId,
          },
        });
      }

      await this.audit.log({
        actorId,
        action: 'DISPENSE_PRESCRIPTION',
        entityType: 'Dispense',
        entityId: dispense.id,
        after: {
          prescriptionId: dto.prescriptionId,
          itemCount: dto.items.length,
          status: 'DISPENSED',
        },
      });

      return dispense;
    });
  }

  async findDispense(id: string) {
    const dispense = await this.prisma.dispense.findUnique({
      where: { id },
      include: {
        prescription: {
          include: {
            items: { include: { drug: true } },
          },
        },
        dispensedBy: { select: { fullName: true } },
        items: {
          include: {
            drug: true,
            lot: { select: { lotNumber: true, expiryDate: true } },
          },
        },
      },
    });
    if (!dispense) throw new NotFoundException(`Dispense ${id} not found`);
    return dispense;
  }

  async listDispenses(query: QueryDispenseDto) {
    const where: Record<string, unknown> = {};
    if (query.prescriptionId) where.prescriptionId = query.prescriptionId;
    if (query.status) where.status = query.status;
    if (query.date) {
      const day = new Date(query.date);
      day.setHours(0, 0, 0, 0);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      where.createdAt = { gte: day, lt: nextDay };
    }

    return this.prisma.dispense.findMany({
      where,
      include: {
        dispensedBy: { select: { fullName: true } },
        items: { include: { drug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancelDispense(id: string, actorId: string) {
    const dispense = await this.findDispense(id);

    // BR-PHR-06: chỉ có thể cancel DISPENSED (không phải CANCELLED)
    if (dispense.status !== DispenseStatus.DISPENSED) {
      throw new BadRequestException('Only DISPENSED dispenses can be cancelled');
    }

    return this.prisma.$transaction(async (tx) => {
      // Hoàn trả kho
      for (const item of dispense.items) {
        await tx.stockLot.update({
          where: { id: item.lotId },
          data: { quantityOnHand: { increment: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            drugId: item.drugId,
            lotId: item.lotId,
            movementType: 'ADJUSTMENT',
            quantity: item.quantity,
            referenceType: 'DISPENSE_CANCEL',
            referenceId: id,
            note: `Hoàn trả do hủy phát thuốc ${id}`,
            createdById: actorId,
          },
        });
      }

      const updated = await tx.dispense.update({
        where: { id },
        data: { status: DispenseStatus.CANCELLED },
        include: { items: { include: { drug: true } } },
      });

      await this.audit.log({
        actorId,
        action: 'CANCEL_DISPENSE',
        entityType: 'Dispense',
        entityId: id,
        before: { status: 'DISPENSED' },
        after: { status: 'CANCELLED' },
      });

      return updated;
    });
  }
}
