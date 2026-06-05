import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CheckinDto } from './dto/checkin.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { QueryAppointmentsDto } from './dto/query-appointments.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateAppointmentDto, actorId: string) {
    // BR-APT-01: scheduledAt phải trong tương lai
    const scheduledAt = new Date(dto.scheduledAt);
    if (scheduledAt <= new Date()) {
      throw new BadRequestException('Scheduled time must be in the future');
    }

    // BR-APT-02: DoctorProfile phải tồn tại và active
    const doctorProfile = await this.prisma.doctorProfile.findUnique({
      where: { id: dto.doctorProfileId },
    });
    if (!doctorProfile || !doctorProfile.isActive) {
      throw new BadRequestException('Doctor profile not found or inactive');
    }

    // BR-APT-03: Patient phải tồn tại
    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
    });
    if (!patient) {
      throw new NotFoundException(`Patient ${dto.patientId} not found`);
    }

    // BR-APT-04: Conflict check — bác sĩ không có 2 appointment overlap
    const durationMinutes = dto.durationMinutes ?? 30;
    const newEnd = new Date(scheduledAt.getTime() + durationMinutes * 60_000);

    const conflicts = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Appointment"
      WHERE "doctorProfileId" = ${dto.doctorProfileId}
        AND status NOT IN ('CANCELLED', 'NO_SHOW')
        AND "scheduledAt" < ${newEnd}
        AND ("scheduledAt" + ("durationMinutes" * INTERVAL '1 minute')) > ${scheduledAt}
    `;
    if (conflicts.length > 0) {
      throw new ConflictException('Doctor has a conflicting appointment at this time');
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        patientId: dto.patientId,
        doctorProfileId: dto.doctorProfileId,
        departmentId: dto.departmentId,
        roomId: dto.roomId ?? null,
        scheduleId: dto.scheduleId ?? null,
        scheduledAt,
        durationMinutes,
        reason: dto.reason ?? null,
        createdById: actorId,
        status: 'SCHEDULED',
      },
      include: {
        patient: { select: { id: true, fullName: true, phone: true } },
        doctorProfile: {
          select: {
            id: true,
            title: true,
            specialty: true,
            user: { select: { fullName: true } },
            department: { select: { name: true } },
          },
        },
      },
    });

    await this.audit.log({
      actorId,
      action: 'CREATE_APPOINTMENT',
      entityType: 'Appointment',
      entityId: appointment.id,
      after: { patientId: dto.patientId, doctorProfileId: dto.doctorProfileId, scheduledAt },
    });

    return appointment;
  }

  async findAll(query: QueryAppointmentsDto) {
    const where: Record<string, unknown> = {};

    if (query.date) {
      const day = new Date(query.date);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      where.scheduledAt = { gte: day, lt: nextDay };
    }
    if (query.doctorProfileId) where.doctorProfileId = query.doctorProfileId;
    if (query.patientId) where.patientId = query.patientId;
    if (query.status) where.status = query.status;
    if (query.departmentId) where.departmentId = query.departmentId;

    return this.prisma.appointment.findMany({
      where,
      include: {
        patient: { select: { id: true, fullName: true, phone: true } },
        doctorProfile: {
          select: {
            id: true,
            title: true,
            specialty: true,
            user: { select: { fullName: true } },
            department: { select: { name: true } },
          },
        },
        visit: { select: { id: true, status: true, queueNumber: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, fullName: true, phone: true, dob: true, gender: true } },
        doctorProfile: {
          select: {
            id: true,
            title: true,
            specialty: true,
            departmentId: true,
            user: { select: { fullName: true, email: true } },
            department: { select: { id: true, name: true } },
          },
        },
        room: { select: { id: true, name: true, code: true } },
        visit: { select: { id: true, status: true, queueNumber: true } },
      },
    });
    if (!appointment) throw new NotFoundException(`Appointment ${id} not found`);
    return appointment;
  }

  async update(id: string, dto: UpdateAppointmentDto, actorId: string) {
    const appointment = await this.findOne(id);

    // Chỉ sửa khi status SCHEDULED
    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException('Only SCHEDULED appointments can be updated');
    }

    if (dto.scheduledAt) {
      const newScheduledAt = new Date(dto.scheduledAt);
      if (newScheduledAt <= new Date()) {
        throw new BadRequestException('Scheduled time must be in the future');
      }

      const durationMinutes = dto.durationMinutes ?? appointment.durationMinutes;
      const newEnd = new Date(newScheduledAt.getTime() + durationMinutes * 60_000);

      const conflicts = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM "Appointment"
        WHERE "doctorProfileId" = ${appointment.doctorProfileId}
          AND id != ${id}
          AND status NOT IN ('CANCELLED', 'NO_SHOW')
          AND "scheduledAt" < ${newEnd}
          AND ("scheduledAt" + ("durationMinutes" * INTERVAL '1 minute')) > ${newScheduledAt}
      `;
      if (conflicts.length > 0) {
        throw new ConflictException('Doctor has a conflicting appointment at this time');
      }
    }

    return this.prisma.appointment.update({
      where: { id },
      data: {
        ...(dto.scheduledAt && { scheduledAt: new Date(dto.scheduledAt) }),
        ...(dto.durationMinutes && { durationMinutes: dto.durationMinutes }),
        ...(dto.reason !== undefined && { reason: dto.reason }),
        ...(dto.roomId !== undefined && { roomId: dto.roomId }),
      },
      include: {
        patient: { select: { id: true, fullName: true } },
        doctorProfile: {
          select: { id: true, user: { select: { fullName: true } } },
        },
      },
    });
  }

  async cancel(id: string, actorId: string) {
    const appointment = await this.findOne(id);

    // BR-APT-05: chỉ cancel SCHEDULED
    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException('Only SCHEDULED appointments can be cancelled');
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.CANCELLED },
    });

    await this.audit.log({
      actorId,
      action: 'CANCEL_APPOINTMENT',
      entityType: 'Appointment',
      entityId: id,
      before: { status: 'SCHEDULED' },
      after: { status: 'CANCELLED' },
    });

    return updated;
  }

  async checkin(id: string, dto: CheckinDto, actorId: string) {
    const appointment = await this.findOne(id);

    // BR-APT-06: chỉ checkin SCHEDULED
    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException('Only SCHEDULED appointments can be checked in');
    }

    // Kiểm tra appointment này chưa tạo visit (Visit.appointmentId unique)
    const existingVisit = await this.prisma.visit.findUnique({
      where: { appointmentId: id },
    });
    if (existingVisit) {
      throw new ConflictException('This appointment has already been checked in');
    }

    // Kiểm tra patient đã có visit hôm nay chưa (unique constraint patientId+visitDate)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existingVisitToday = await this.prisma.visit.findFirst({
      where: { patientId: appointment.patientId, visitDate: today },
    });
    if (existingVisitToday) {
      throw new ConflictException('Patient already has a visit today');
    }

    return this.prisma.$transaction(async (tx) => {
      // BR-APT-07: QueueNumber tăng dần trong ngày (visit queue)
      const lastVisit = await tx.visit.findFirst({
        where: { visitDate: today },
        orderBy: { queueNumber: 'desc' },
      });
      const visitQueueNumber = (lastVisit?.queueNumber ?? 0) + 1;

      // Tạo Visit gắn với appointment
      const visit = await tx.visit.create({
        data: {
          patientId: appointment.patientId,
          visitDate: today,
          queueNumber: visitQueueNumber,
          reason: appointment.reason,
          status: 'REGISTERED',
          createdByUserId: actorId,
          departmentId: appointment.departmentId,
          appointmentId: appointment.id,
        },
      });

      // Tạo QueueTicket gắn với Visit
      const lastTicket = await tx.queueTicket.findFirst({
        where: {
          departmentId: appointment.departmentId,
          queueDate: today,
        },
        orderBy: { queueNumber: 'desc' },
      });
      const ticketQueueNumber = (lastTicket?.queueNumber ?? 0) + 1;

      const ticket = await tx.queueTicket.create({
        data: {
          visitId: visit.id,
          departmentId: appointment.departmentId,
          queueDate: today,
          queueNumber: ticketQueueNumber,
          priority: 0,
          status: 'WAITING',
        },
      });

      // Cập nhật appointment → CHECKED_IN
      await tx.appointment.update({
        where: { id },
        data: { status: AppointmentStatus.CHECKED_IN },
      });

      await this.audit.log({
        actorId,
        action: 'CHECKIN_APPOINTMENT',
        entityType: 'Appointment',
        entityId: id,
        after: { visitId: visit.id, ticketId: ticket.id, ticketNumber: ticketQueueNumber },
      });

      return { visit, ticket };
    });
  }
}
