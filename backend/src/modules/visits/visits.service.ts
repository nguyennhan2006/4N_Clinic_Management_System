import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, VisitStatus } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateVisitDto } from './dto/create-visit.dto';

const DAILY_PATIENT_LIMIT = 40;

function toDateOnly(value?: string): Date {
  const source = value || new Date().toISOString().slice(0, 10);
  return new Date(`${source}T00:00:00.000Z`);
}

@Injectable()
export class VisitsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateVisitDto, userId: string) {
    const visitDate = toDateOnly(dto.visitDate);

    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
    });

    if (!patient) {
      throw new BadRequestException('Patient not found');
    }

    return this.prisma.$transaction(
      async (tx) => {
        const activeVisitToday = await tx.visit.findFirst({
          where: {
            patientId: dto.patientId,
            visitDate,
            status: {
              in: [
                VisitStatus.WAITING,
                VisitStatus.IN_EXAMINATION,
                VisitStatus.COMPLETED,
              ],
            },
          },
        });

        if (activeVisitToday) {
          throw new BadRequestException(
            'Patient already has a visit on this date',
          );
        }

        const totalToday = await tx.visit.count({
          where: {
            visitDate,
            status: {
              not: VisitStatus.CANCELLED,
            },
          },
        });

        if (totalToday >= DAILY_PATIENT_LIMIT) {
          throw new BadRequestException('Daily patient limit reached');
        }

        const latestVisit = await tx.visit.findFirst({
          where: { visitDate },
          orderBy: { queueNumber: 'desc' },
        });

        const queueNumber = (latestVisit?.queueNumber || 0) + 1;

        return tx.visit.create({
          data: {
            patientId: dto.patientId,
            visitDate,
            reason: dto.reason,
            queueNumber,
            createdByUserId: userId,
          },
          include: {
            patient: true,
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  async findAll(date?: string) {
    const visitDate = date ? toDateOnly(date) : undefined;

    return this.prisma.visit.findMany({
      where: visitDate ? { visitDate } : undefined,
      include: {
        patient: true,
        examination: true,
        invoice: true,
      },
      orderBy: [{ visitDate: 'desc' }, { queueNumber: 'asc' }],
    });
  }

  async openExamination(visitId: string, doctorUserId: string) {
    return this.prisma.$transaction(async (tx) => {
      const visit = await tx.visit.findUnique({
        where: { id: visitId },
        include: { examination: true },
      });

      if (!visit) {
        throw new BadRequestException('Visit not found');
      }

      if (visit.examination) {
        return visit.examination;
      }

      if (visit.status !== VisitStatus.WAITING) {
        throw new BadRequestException('Only WAITING visit can be examined');
      }

      const examination = await tx.examination.create({
        data: {
          visitId,
          doctorUserId,
        },
      });

      await tx.visit.update({
        where: { id: visitId },
        data: { status: VisitStatus.IN_EXAMINATION },
      });

      return examination;
    });
  }
}
