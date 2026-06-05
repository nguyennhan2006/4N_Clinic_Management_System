import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueueStatus } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { QueryQueueDto } from './dto/query-queue.dto';

// Allowed state transitions
const ALLOWED_TRANSITIONS: Record<QueueStatus, QueueStatus[]> = {
  WAITING: ['CALLED', 'SKIPPED', 'CANCELLED'],
  CALLED: ['IN_SERVICE', 'CANCELLED'],
  IN_SERVICE: ['DONE'],
  DONE: [],
  SKIPPED: [],
  CANCELLED: [],
};

@Injectable()
export class QueueService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryQueueDto) {
    const date = query.date ? new Date(query.date) : new Date();
    date.setHours(0, 0, 0, 0);

    const where: Record<string, unknown> = { queueDate: date };
    if (query.departmentId) where.departmentId = query.departmentId;
    if (query.status) where.status = query.status;

    return this.prisma.queueTicket.findMany({
      where,
      include: {
        visit: {
          include: {
            patient: { select: { id: true, fullName: true, phone: true } },
          },
        },
        department: { select: { id: true, name: true } },
      },
      orderBy: [{ priority: 'desc' }, { queueNumber: 'asc' }],
    });
  }

  async findOne(id: string) {
    const ticket = await this.prisma.queueTicket.findUnique({
      where: { id },
      include: {
        visit: {
          include: {
            patient: { select: { id: true, fullName: true, phone: true } },
            examination: { select: { id: true, status: true } },
          },
        },
        department: { select: { id: true, name: true } },
      },
    });
    if (!ticket) throw new NotFoundException(`QueueTicket ${id} not found`);
    return ticket;
  }

  async updateStatus(id: string, newStatus: QueueStatus, actorId: string) {
    const ticket = await this.findOne(id);
    const currentStatus = ticket.status as QueueStatus;

    const allowed = ALLOWED_TRANSITIONS[currentStatus];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition queue from ${currentStatus} to ${newStatus}. Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }

    const updateData: Record<string, unknown> = { status: newStatus };
    if (newStatus === 'CALLED') updateData.calledAt = new Date();
    if (newStatus === 'DONE') updateData.completedAt = new Date();

    return this.prisma.queueTicket.update({
      where: { id },
      data: updateData,
      include: {
        visit: {
          include: {
            patient: { select: { id: true, fullName: true } },
          },
        },
        department: { select: { id: true, name: true } },
      },
    });
  }

  // Lấy ticket tiếp theo đang WAITING trong department của actor
  async getNext(departmentId?: string) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);

    const where: Record<string, unknown> = {
      queueDate: date,
      status: 'WAITING',
    };
    if (departmentId) where.departmentId = departmentId;

    return this.prisma.queueTicket.findFirst({
      where,
      include: {
        visit: {
          include: {
            patient: { select: { id: true, fullName: true, phone: true } },
          },
        },
        department: { select: { id: true, name: true } },
      },
      orderBy: [{ priority: 'desc' }, { queueNumber: 'asc' }],
    });
  }
}
