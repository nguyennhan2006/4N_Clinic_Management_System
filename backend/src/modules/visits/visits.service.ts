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

// Active = visit còn trong luồng khám. CANCELLED và REGISTERED (chưa dùng Phase 1) không tính.
const ACTIVE_VISIT_STATUSES = [
  VisitStatus.WAITING,
  VisitStatus.IN_EXAMINATION,
  VisitStatus.COMPLETED,
] as const;

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

  // UC-06: Tiếp nhận bệnh nhân / tạo lượt khám
  async create(dto: CreateVisitDto, userId: string) {
    const visitDate = toDateOnly(dto.visitDate);

    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // TODO(regulations): dùng RegulationsService khi service có method getCurrent() đầy đủ.
    // Hiện tại đọc trực tiếp Prisma tại đây với fallback 40.
    const maxPatientsPerDay = await this.getMaxPatientsPerDay();

    const newVisit = await this.prisma.$transaction(
      async (tx) => {
        // Chỉ chặn nếu có visit ACTIVE (WAITING/IN_EXAMINATION/COMPLETED) cùng ngày.
        // CANCELLED không tính → nhưng xem known limitation bên dưới.
        //
        // Known limitation: DB constraint @@unique([patientId, visitDate]) chặn
        // TẤT CẢ visit thứ 2 kể cả sau khi cancel vì constraint không lọc theo status.
        // Cần migration thêm partial unique index trên PostgreSQL để fix đúng cho phase 2.
        const duplicateActive = await tx.visit.findFirst({
          where: {
            patientId: dto.patientId,
            visitDate,
            status: { in: [...ACTIVE_VISIT_STATUSES] },
          },
        });

        if (duplicateActive) {
          throw new ConflictException(
            'Patient already has an active visit on this date',
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

    return {
      ...newVisit,
      // WAITING cho phép mở khám hoặc huỷ. Cập nhật khi status thay đổi ở các endpoint khác.
      allowedActions: ['OPEN_EXAMINATION', 'CANCEL_VISIT'],
    };
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
