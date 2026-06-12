import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

export interface AuditLogParams {
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: AuditLogParams): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorId: params.actorId ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        before: (params.before as Prisma.InputJsonValue) ?? undefined,
        after: (params.after as Prisma.InputJsonValue) ?? undefined,
      },
    });
  }

  async findAll(query: {
    entityType?: string;
    actorId?: string;
    page?: number;
    limit?: number;
  }) {
    const { entityType, actorId, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(entityType ? { entityType } : {}),
      ...(actorId ? { actorId } : {}),
    };

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data: logs, total, page, limit };
  }
}
