import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { QueryPatientsDto } from './dto/query-patients.dto';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  // UC-05: tạo hồ sơ bệnh nhân
  async create(dto: CreatePatientDto, _userId?: string) {
    const fullName = dto.fullName.trim();
    const phone = dto.phone?.trim() || undefined;

    if (dto.dob) {
      const dob = new Date(`${dto.dob}T00:00:00.000Z`);
      if (dob > new Date()) {
        throw new BadRequestException('Date of birth cannot be in the future');
      }
    }

    if (dto.citizenId) {
      const existed = await this.prisma.patient.findUnique({
        where: { citizenId: dto.citizenId },
      });
      if (existed) {
        throw new ConflictException('Patient citizenId already exists');
      }
    }

    const warnings = await this.checkDuplicateWarnings(
      fullName,
      phone,
      dto.dob,
    );

    const patient = await this.prisma.$transaction(
      async (tx) => {
        // Tìm patientCode lớn nhất theo format BN-XXXXXX.
        // Dùng alphabetical desc — đúng vì zero-padded 6 chữ số: BN-000010 > BN-000002.
        // An toàn hơn count()+1: không bị sai khi có bản ghi bị xóa.
        const latest = await tx.patient.findFirst({
          where: { patientCode: { startsWith: 'BN-' } },
          orderBy: { patientCode: 'desc' },
          select: { patientCode: true },
        });

        let nextNum = 1;
        if (latest) {
          const match = /^BN-(\d+)$/.exec(latest.patientCode);
          // Nếu không parse được (format lạ), giữ nextNum = 1 — P2002 unique constraint sẽ bắt nếu trùng.
          if (match) {
            nextNum = parseInt(match[1], 10) + 1;
          }
        }

        const patientCode = `BN-${String(nextNum).padStart(6, '0')}`;

        return tx.patient.create({
          data: {
            patientCode,
            fullName,
            dob: dto.dob ? new Date(`${dto.dob}T00:00:00.000Z`) : undefined,
            gender: dto.gender,
            phone,
            citizenId: dto.citizenId,
            address: dto.address?.trim(),
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    // TODO(audit): ghi log PATIENT_CREATED với userId khi AuditService triển khai method log()
    // Hiện tại AuditService chỉ là stub, chưa export từ AuditModule.

    return { ...patient, warnings };
  }

  // Soft duplicate check — không chặn tạo, chỉ trả cảnh báo để receptionist xác nhận.
  private async checkDuplicateWarnings(
    fullName: string,
    phone: string | undefined,
    dob: string | undefined,
  ): Promise<string[]> {
    const dobFilter = dob
      ? {
          gte: new Date(`${dob}T00:00:00.000Z`),
          lte: new Date(`${dob}T23:59:59.999Z`),
        }
      : undefined;

    const [byPhone, byNameDob, byPhoneDob] = await Promise.all([
      phone
        ? this.prisma.patient.findFirst({ where: { phone } })
        : Promise.resolve(null),
      fullName && dobFilter
        ? this.prisma.patient.findFirst({
            where: {
              fullName: { equals: fullName, mode: 'insensitive' },
              dob: dobFilter,
            },
          })
        : Promise.resolve(null),
      phone && dobFilter
        ? this.prisma.patient.findFirst({
            where: { phone, dob: dobFilter },
          })
        : Promise.resolve(null),
    ]);

    const warnings: string[] = [];
    if (byPhone) warnings.push('Số điện thoại đã được dùng bởi bệnh nhân khác');
    if (byNameDob)
      warnings.push('Đã tồn tại bệnh nhân cùng họ tên và ngày sinh');
    if (byPhoneDob)
      warnings.push('Đã tồn tại bệnh nhân cùng số điện thoại và ngày sinh');
    return warnings;
  }

  // UC-04: tìm kiếm bệnh nhân với pagination
  async findAll(query: QueryPatientsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.PatientWhereInput = {};

    if (query.keyword) {
      where.OR = [
        { fullName: { contains: query.keyword, mode: 'insensitive' } },
        { patientCode: { contains: query.keyword, mode: 'insensitive' } },
      ];
    }

    if (query.phone) {
      where.phone = { contains: query.phone };
    }

    if (query.dob) {
      // dob stored as full DateTime — match toàn bộ ngày UTC
      where.dob = {
        gte: new Date(`${query.dob}T00:00:00.000Z`),
        lte: new Date(`${query.dob}T23:59:59.999Z`),
      };
    }

    const [total, data] = await Promise.all([
      this.prisma.patient.count({ where }),
      this.prisma.patient.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          patientCode: true,
          fullName: true,
          dob: true,
          gender: true,
          phone: true,
          citizenId: true,
          address: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      data,
      meta: { total, page, limit },
    };
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
