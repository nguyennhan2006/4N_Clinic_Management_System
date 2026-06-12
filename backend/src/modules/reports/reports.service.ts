import { BadRequestException, Injectable } from '@nestjs/common';
import { InvoiceStatus, VisitStatus } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  // UC-20: Báo cáo doanh thu theo tháng
  async getMonthlySummary(month: string) {
    // month format: YYYY-MM
    if (!/^\d{4}-\d{2}$/.test(month)) {
      throw new BadRequestException('month must be in YYYY-MM format');
    }

    const [year, mon] = month.split('-').map(Number);
    const start = new Date(Date.UTC(year, mon - 1, 1));
    const end = new Date(Date.UTC(year, mon, 1)); // exclusive

    const [visits, invoices] = await Promise.all([
      this.prisma.visit.groupBy({
        by: ['status'],
        where: {
          visitDate: { gte: start, lt: end },
        },
        _count: { id: true },
      }),
      this.prisma.invoice.findMany({
        where: {
          createdAt: { gte: start, lt: end },
          status: { in: [InvoiceStatus.PAID, InvoiceStatus.PARTIALLY_PAID] },
        },
        select: { totalAmount: true, paidAmount: true, status: true },
      }),
    ]);

    const visitSummary = {
      total: visits.reduce((sum, v) => sum + v._count.id, 0),
      byStatus: Object.fromEntries(visits.map((v) => [v.status, v._count.id])),
    };

    const completedVisits =
      (visitSummary.byStatus[VisitStatus.COMPLETED] ?? 0) +
      (visitSummary.byStatus[VisitStatus.CANCELLED] ?? 0);

    const revenue = invoices.reduce(
      (acc, inv) => {
        acc.totalBilled += Number(inv.totalAmount);
        acc.totalCollected += Number(inv.paidAmount);
        if (inv.status === InvoiceStatus.PAID) acc.paidCount += 1;
        else acc.partialCount += 1;
        return acc;
      },
      { totalBilled: 0, totalCollected: 0, paidCount: 0, partialCount: 0 },
    );

    // Revenue breakdown by invoice item type
    const itemTypes = ['CONSULTATION', 'SERVICE', 'DRUG'] as const;
    const revenueByType: Record<string, number> = {};

    await Promise.all(
      itemTypes.map(async (type) => {
        const agg = await this.prisma.invoiceItem.aggregate({
          where: {
            itemType: type,
            invoice: {
              status: {
                in: [InvoiceStatus.PAID, InvoiceStatus.PARTIALLY_PAID],
              },
              createdAt: { gte: start, lt: end },
            },
          },
          _sum: { lineTotal: true },
        });
        revenueByType[type] = Number(agg._sum.lineTotal ?? 0);
      }),
    );

    return {
      month,
      visits: visitSummary,
      completedVisits,
      revenue,
      revenueByType,
    };
  }

  async getRevenueBreakdown(month: string) {
    if (!/^\d{4}-\d{2}$/.test(month)) {
      throw new BadRequestException('month must be in YYYY-MM format');
    }

    const [year, mon] = month.split('-').map(Number);
    const start = new Date(Date.UTC(year, mon - 1, 1));
    const end = new Date(Date.UTC(year, mon, 1));

    const itemTypes = ['CONSULTATION', 'SERVICE', 'DRUG'] as const;
    const byType: Record<string, number> = {};

    await Promise.all(
      itemTypes.map(async (type) => {
        const agg = await this.prisma.invoiceItem.aggregate({
          where: {
            itemType: type,
            invoice: {
              status: {
                in: [InvoiceStatus.PAID, InvoiceStatus.PARTIALLY_PAID],
              },
              createdAt: { gte: start, lt: end },
            },
          },
          _sum: { lineTotal: true },
        });
        byType[type] = Number(agg._sum.lineTotal ?? 0);
      }),
    );

    const total = Object.values(byType).reduce((s, v) => s + v, 0);

    return { month, byType, total };
  }
}
