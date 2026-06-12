import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';

@Injectable()
export class PatientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // UC-04: tạo hồ sơ + sinh patientCode duy nhất (BN-000001)
  async create(dto: CreatePatientDto, actorId: string) {
    if (dto.citizenId) {
      const existed = await this.prisma.patient.findUnique({
        where: { citizenId: dto.citizenId },
      });

      if (existed) {
        throw new ConflictException('Patient citizenId already exists');
      }
    }

    const patient = await this.prisma.$transaction(
      async (tx) => {
        const count = await tx.patient.count();
        const patientCode = `BN-${String(count + 1).padStart(6, '0')}`;

        return tx.patient.create({
          data: {
            patientCode,
            fullName: dto.fullName,
            dob: dto.dob ? new Date(dto.dob) : undefined,
            gender: dto.gender,
            phone: dto.phone,
            citizenId: dto.citizenId,
            address: dto.address,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    await this.auditService.log({
      actorId,
      action: 'CREATE_PATIENT',
      entityType: 'Patient',
      entityId: patient.id,
      after: { fullName: patient.fullName, patientCode: patient.patientCode },
    });

    return patient;
  }

  async findAll(keyword?: string) {
    return this.prisma.patient.findMany({
      where: keyword
        ? {
            OR: [
              { fullName: { contains: keyword, mode: 'insensitive' } },
              { phone: { contains: keyword } },
              { citizenId: { contains: keyword } },
              { patientCode: { contains: keyword, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async findOne(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        visits: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return patient;
  }

  // UC-11: Xem lịch sử khám
  async getMedicalHistory(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      select: {
        id: true,
        patientCode: true,
        fullName: true,
        dob: true,
        gender: true,
        phone: true,
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // HIST-002: chỉ lấy visit đã có examination
    const visits = await this.prisma.visit.findMany({
      where: { patientId: id, examination: { isNot: null } },
      orderBy: [{ visitDate: 'desc' }, { queueNumber: 'desc' }],
      select: {
        id: true,
        visitDate: true,
        queueNumber: true,
        status: true,
        reason: true,
        examination: {
          select: {
            id: true,
            status: true,
            symptoms: true,
            clinicalNotes: true,
            conclusion: true,
            completedAt: true,
            doctor: { select: { id: true, fullName: true } },
            diagnoses: {
              select: {
                id: true,
                name: true,
                isPrimary: true,
                disease: { select: { id: true, code: true, name: true } },
              },
            },
            prescription: {
              select: {
                id: true,
                note: true,
                items: {
                  select: {
                    id: true,
                    quantity: true,
                    dosage: true,
                    unitPrice: true,
                    lineTotal: true,
                    drug: { select: { id: true, name: true, unit: true } },
                  },
                },
              },
            },
          },
        },
        invoice: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
            paidAmount: true,
            items: true,
            payments: true,
          },
        },
      },
    });

    return {
      patient,
      total: visits.length,
      histories: visits,
    };
  }
}
