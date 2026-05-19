import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, VisitStatus } from '@prisma/client';

import { toDateOnly } from '../../common/utils/date-only.util';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { QueryVisitsDto } from './dto/query-visits.dto';

const DEFAULT_MAX_PATIENTS_PER_DAY = 40;

@Injectable()
export class VisitsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getMaxPatientsPerDay(): Promise<number> {
    const activeVersion = await this.prisma.regulationVersion.findFirst({
      where: { isActive: true },
      include: { items: true },
    });

    const item = activeVersion?.items.find(
      (i) => i.key === 'MAX_PATIENTS_PER_DAY',
    );

    const parsed = item ? Number(item.value) : NaN;

    return Number.isFinite(parsed) && parsed > 0
      ? parsed
      : DEFAULT_MAX_PATIENTS_PER_DAY;
  }

  // UC-07: Tạo lượt khám
  async create(dto: CreateVisitDto, userId: string) {
    const visitDate = toDateOnly(dto.visitDate);

    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const maxPatientsPerDay = await this.getMaxPatientsPerDay();

    return this.prisma.$transaction(
      async (tx) => {
        const duplicateToday = await tx.visit.findFirst({
          where: { patientId: dto.patientId, visitDate },
        });

        if (duplicateToday) {
          throw new ConflictException(
            'Patient already has a visit on this date',
          );
        }

        const totalToday = await tx.visit.count({
          where: {
            visitDate,
            status: { not: VisitStatus.CANCELLED },
          },
        });

        if (totalToday >= maxPatientsPerDay) {
          throw new ConflictException(
            `Daily patient limit reached (${maxPatientsPerDay})`,
          );
        }

        const latestVisit = await tx.visit.findFirst({
          where: { visitDate },
          orderBy: { queueNumber: 'desc' },
        });

        const queueNumber = (latestVisit?.queueNumber ?? 0) + 1;

        return tx.visit.create({
          data: {
            patientId: dto.patientId,
            visitDate,
            reason: dto.reason,
            queueNumber,
            status: VisitStatus.WAITING,
            createdByUserId: userId,
          },
          include: {
            patient: {
              select: {
                id: true,
                patientCode: true,
                fullName: true,
                phone: true,
                dob: true,
              },
            },
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  // UC-08: Xem danh sách khám
  async findAll(query: QueryVisitsDto) {
    const visitDate = toDateOnly(query.date);

    return this.prisma.visit.findMany({
      where: {
        visitDate,
        ...(query.status ? { status: query.status } : {}),
      },
      select: {
        id: true,
        visitDate: true,
        queueNumber: true,
        status: true,
        reason: true,
        patient: {
          select: {
            id: true,
            patientCode: true,
            fullName: true,
            phone: true,
            dob: true,
          },
        },
        createdByUser: {
          select: { id: true, fullName: true },
        },
        examination: {
          select: { id: true, status: true },
        },
      },
      orderBy: [{ queueNumber: 'asc' }, { createdAt: 'asc' }],
    });
  }

  // UC-09: Mở lượt khám
  async openExamination(visitId: string, doctorUserId: string) {
    // Validate doctor active trước transaction (BR-09)
    const doctor = await this.prisma.user.findUnique({
      where: { id: doctorUserId },
    });

    if (!doctor || doctor.status !== 'ACTIVE') {
      throw new BadRequestException('Doctor account is inactive or not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const visit = await tx.visit.findUnique({
        where: { id: visitId },
        include: { examination: true },
      });

      if (!visit) {
        throw new NotFoundException('Visit not found');
      }

      if (visit.examination) {
        throw new ConflictException(
          'Examination already exists for this visit',
        );
      }

      if (visit.status !== VisitStatus.WAITING) {
        throw new BadRequestException(
          `Cannot open examination: visit status is ${visit.status}, expected WAITING`,
        );
      }

      const examination = await tx.examination.create({
        data: { visitId, doctorUserId },
      });

      await tx.visit.update({
        where: { id: visitId },
        data: { status: VisitStatus.IN_EXAMINATION },
      });

      return examination;
    });
  }
}
