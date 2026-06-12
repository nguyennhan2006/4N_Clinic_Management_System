import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateStockLotDto, QueryStockDto } from './dto/create-stock-lot.dto';

const LOW_STOCK_THRESHOLD = 10;

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getStockSummary(query: QueryStockDto) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lotsWhere: Record<string, unknown> = {
      quantityOnHand: { gt: 0 },
    };
    if (query.drugId) lotsWhere.drugId = query.drugId;
    if (query.expiringSoon === 'true') {
      const in30 = new Date(today);
      in30.setDate(in30.getDate() + 30);
      lotsWhere.expiryDate = { lte: in30 };
    }

    const lots = await this.prisma.stockLot.findMany({
      where: lotsWhere,
      include: { drug: true },
      orderBy: { expiryDate: 'asc' },
    });

    // Group by drugId, tổng hợp tồn kho
    const grouped = new Map<
      string,
      { drug: (typeof lots)[0]['drug']; totalOnHand: number; lots: typeof lots }
    >();
    for (const lot of lots) {
      const key = lot.drugId;
      if (!grouped.has(key)) {
        grouped.set(key, { drug: lot.drug, totalOnHand: 0, lots: [] });
      }
      const entry = grouped.get(key)!;
      entry.totalOnHand += lot.quantityOnHand;
      entry.lots.push(lot);
    }

    let result = Array.from(grouped.values());

    // Filter lowStock sau khi group
    if (query.lowStock === 'true') {
      result = result.filter((r) => r.totalOnHand < LOW_STOCK_THRESHOLD);
    }

    return result;
  }

  async listLots(drugId?: string) {
    return this.prisma.stockLot.findMany({
      where: { ...(drugId ? { drugId } : {}) },
      include: {
        drug: { select: { id: true, name: true, unit: true } },
      },
      orderBy: [{ drugId: 'asc' }, { expiryDate: 'asc' }],
    });
  }

  async findLot(id: string) {
    const lot = await this.prisma.stockLot.findUnique({
      where: { id },
      include: {
        drug: true,
        movements: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!lot) throw new NotFoundException(`StockLot ${id} not found`);
    return lot;
  }

  async createLot(dto: CreateStockLotDto, actorId: string) {
    // Validate drug tồn tại
    const drug = await this.prisma.drug.findUnique({
      where: { id: dto.drugId },
    });
    if (!drug) throw new NotFoundException(`Drug ${dto.drugId} not found`);

    // BR-INV-01: lotNumber phải unique per drugId
    const existing = await this.prisma.stockLot.findUnique({
      where: {
        drugId_lotNumber: { drugId: dto.drugId, lotNumber: dto.lotNumber },
      },
    });
    if (existing) {
      throw new ConflictException(
        `Lot number "${dto.lotNumber}" already exists for drug "${drug.name}"`,
      );
    }

    if (dto.expiryDate) {
      const expiry = new Date(dto.expiryDate);
      if (expiry <= new Date()) {
        throw new BadRequestException('Expiry date must be in the future');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const lot = await tx.stockLot.create({
        data: {
          drugId: dto.drugId,
          lotNumber: dto.lotNumber,
          expiryDate: dto.expiryDate
            ? new Date(dto.expiryDate)
            : new Date('2099-12-31'),
          quantityOnHand: dto.quantity,
          unitCost: dto.unitCost,
          receivedAt: new Date(),
        },
        include: { drug: true },
      });

      // Ghi StockMovement type=IN (nhập kho)
      await tx.stockMovement.create({
        data: {
          drugId: dto.drugId,
          lotId: lot.id,
          movementType: 'IN',
          quantity: dto.quantity,
          referenceType: 'IMPORT',
          referenceId: lot.id,
          note: dto.supplierName ? `Nhập từ ${dto.supplierName}` : null,
          createdById: actorId,
        },
      });

      return lot;
    });
  }

  async listMovements(drugId?: string) {
    return this.prisma.stockMovement.findMany({
      where: { ...(drugId ? { drugId } : {}) },
      include: {
        drug: { select: { id: true, name: true, unit: true } },
        lot: { select: { lotNumber: true, expiryDate: true } },
        createdBy: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async getDrugStock(drugId: string) {
    const drug = await this.prisma.drug.findUnique({ where: { id: drugId } });
    if (!drug) throw new NotFoundException(`Drug ${drugId} not found`);

    const lots = await this.prisma.stockLot.findMany({
      where: { drugId, quantityOnHand: { gt: 0 } },
      orderBy: { expiryDate: 'asc' },
    });

    const totalOnHand = lots.reduce((sum, l) => sum + l.quantityOnHand, 0);
    return { drug, totalOnHand, lots };
  }
}
