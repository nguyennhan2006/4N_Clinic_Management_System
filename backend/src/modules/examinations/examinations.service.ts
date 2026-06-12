import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ExaminationStatus, VisitStatus } from '@prisma/client';

import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdateExaminationDto } from './dto/update-examination.dto';

@Injectable()
export class ExaminationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findOne(id: string) {
    const examination = await this.prisma.examination.findUnique({
      where: { id },
      include: {
        visit: { include: { patient: true } },
        diagnoses: { include: { disease: true } },
        prescription: {
          include: { items: { include: { drug: true } } },
        },
      },
    });

    if (!examination) {
      throw new NotFoundException('Examination not found');
    }

    return examination;
  }

  // UC-10: Lập / cập nhật phiếu khám (kèm diagnoses)
  async update(id: string, dto: UpdateExaminationDto) {
    const examination = await this.prisma.examination.findUnique({
      where: { id },
    });

    if (!examination) {
      throw new NotFoundException('Examination not found');
    }

    if (
      examination.status === ExaminationStatus.COMPLETED ||
      examination.status === ExaminationStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot edit examination with status ${examination.status}`,
      );
    }

    // Chuẩn bị snapshot diagnosis nếu request có gửi
    let diagnosisRows:
      | { name: string; diseaseId: string; isPrimary: boolean }[]
      | undefined;

    if (dto.diagnoses !== undefined) {
      const primaryCount = dto.diagnoses.filter((d) => d.isPrimary).length;

      if (primaryCount > 1) {
        throw new BadRequestException(
          'At most one primary diagnosis is allowed',
        );
      }

      const diseaseIds = [...new Set(dto.diagnoses.map((d) => d.diseaseId))];

      if (diseaseIds.length > 0) {
        const diseases = await this.prisma.disease.findMany({
          where: { id: { in: diseaseIds }, isActive: true },
        });

        if (diseases.length !== diseaseIds.length) {
          throw new BadRequestException(
            'Some diseases are invalid or inactive',
          );
        }

        const diseaseMap = new Map(diseases.map((d) => [d.id, d]));

        diagnosisRows = dto.diagnoses.map((d) => ({
          name: diseaseMap.get(d.diseaseId)!.name, // snapshot tên bệnh
          diseaseId: d.diseaseId,
          isPrimary: d.isPrimary ?? false,
        }));
      } else {
        diagnosisRows = [];
      }
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.examination.update({
        where: { id },
        data: {
          symptoms: dto.symptoms,
          clinicalNotes: dto.clinicalNotes,
          conclusion: dto.conclusion,
        },
      });

      if (diagnosisRows !== undefined) {
        await tx.diagnosis.deleteMany({ where: { examinationId: id } });

        if (diagnosisRows.length > 0) {
          await tx.diagnosis.createMany({
            data: diagnosisRows.map((row) => ({
              examinationId: id,
              name: row.name,
              diseaseId: row.diseaseId,
              isPrimary: row.isPrimary,
            })),
          });
        }
      }

      return tx.examination.findUniqueOrThrow({
        where: { id },
        include: { diagnoses: { include: { disease: true } } },
      });
    });
  }

  async createPrescription(id: string, dto: CreatePrescriptionDto) {
    const examination = await this.prisma.examination.findUnique({
      where: { id },
      include: { prescription: true },
    });

    if (!examination) {
      throw new NotFoundException('Examination not found');
    }

    if (examination.status === ExaminationStatus.COMPLETED) {
      throw new BadRequestException(
        'Cannot create prescription for completed examination',
      );
    }

    if (examination.prescription) {
      throw new BadRequestException('Prescription already exists');
    }

    if (!dto.items.length) {
      throw new BadRequestException('Prescription must have at least one item');
    }

    return this.prisma.$transaction(async (tx) => {
      const drugIds = dto.items.map((item) => item.drugId);

      const drugs = await tx.drug.findMany({
        where: { id: { in: drugIds }, isActive: true },
      });

      if (drugs.length !== new Set(drugIds).size) {
        throw new BadRequestException('Some drugs are invalid or inactive');
      }

      const drugMap = new Map(drugs.map((drug) => [drug.id, drug]));

      return tx.prescription.create({
        data: {
          examinationId: id,
          note: dto.note,
          items: {
            create: dto.items.map((item) => {
              const drug = drugMap.get(item.drugId);

              if (!drug) {
                throw new BadRequestException('Drug not found');
              }

              const unitPrice = Number(drug.price);
              const lineTotal = unitPrice * item.quantity;

              return {
                drugId: item.drugId,
                quantity: item.quantity,
                dosage: item.dosage,
                unitPrice,
                lineTotal,
              };
            }),
          },
        },
        include: {
          items: { include: { drug: true } },
        },
      });
    });
  }

  // UC-12: Replace-all prescription (upsert)
  async upsertPrescription(id: string, dto: CreatePrescriptionDto) {
    const examination = await this.prisma.examination.findUnique({
      where: { id },
      include: { prescription: { include: { items: true } } },
    });

    if (!examination) {
      throw new NotFoundException('Examination not found');
    }

    if (examination.status === ExaminationStatus.COMPLETED) {
      throw new BadRequestException(
        'Cannot update prescription for completed examination',
      );
    }

    if (!dto.items.length) {
      throw new BadRequestException('Prescription must have at least one item');
    }

    return this.prisma.$transaction(async (tx) => {
      const drugIds = dto.items.map((item) => item.drugId);

      const drugs = await tx.drug.findMany({
        where: { id: { in: drugIds }, isActive: true },
      });

      if (drugs.length !== new Set(drugIds).size) {
        throw new BadRequestException('Some drugs are invalid or inactive');
      }

      const drugMap = new Map(drugs.map((drug) => [drug.id, drug]));

      const itemsData = dto.items.map((item) => {
        const drug = drugMap.get(item.drugId)!;
        const unitPrice = Number(drug.price);
        return {
          drugId: item.drugId,
          quantity: item.quantity,
          dosage: item.dosage,
          unitPrice,
          lineTotal: unitPrice * item.quantity,
        };
      });

      if (examination.prescription) {
        // Delete existing items, then recreate (cascade deletes items via onDelete: Cascade)
        await tx.prescription.delete({
          where: { examinationId: id },
        });
      }

      return tx.prescription.create({
        data: {
          examinationId: id,
          note: dto.note,
          items: { create: itemsData },
        },
        include: { items: { include: { drug: true } } },
      });
    });
  }

  async deletePrescription(id: string) {
    const examination = await this.prisma.examination.findUnique({
      where: { id },
      include: { prescription: true },
    });

    if (!examination) {
      throw new NotFoundException('Examination not found');
    }

    if (examination.status === ExaminationStatus.COMPLETED) {
      throw new BadRequestException(
        'Cannot delete prescription for completed examination',
      );
    }

    if (!examination.prescription) {
      return; // idempotent — no prescription to delete
    }

    await this.prisma.prescription.delete({ where: { examinationId: id } });
  }

  async complete(id: string, actorId: string) {
    const completed = await this.prisma.$transaction(async (tx) => {
      const examination = await tx.examination.findUnique({
        where: { id },
        include: { diagnoses: true },
      });

      if (!examination) {
        throw new NotFoundException('Examination not found');
      }

      if (examination.status === ExaminationStatus.COMPLETED) {
        return examination;
      }

      if (examination.status === ExaminationStatus.CANCELLED) {
        throw new BadRequestException(
          'Cannot complete a cancelled examination',
        );
      }

      if (!examination.symptoms || !examination.conclusion) {
        throw new BadRequestException(
          'Symptoms and conclusion are required before completing examination',
        );
      }

      // BR-LAB-05: Required service orders phải COMPLETED trước khi hoàn tất khám
      const requiredPending = await tx.serviceOrder.count({
        where: {
          visitId: examination.visitId,
          isRequired: true,
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
        },
      });
      if (requiredPending > 0) {
        throw new BadRequestException(
          `${requiredPending} required service order(s) must be completed before finishing examination`,
        );
      }

      const primaryDiagnosis = examination.diagnoses.find(
        (diagnosis) => diagnosis.isPrimary,
      );

      if (!primaryDiagnosis) {
        throw new BadRequestException(
          'Primary diagnosis is required before completing examination',
        );
      }

      const result = await tx.examination.update({
        where: { id },
        data: {
          status: ExaminationStatus.COMPLETED,
          completedAt: new Date(),
        },
        include: {
          diagnoses: true,
          prescription: { include: { items: true } },
        },
      });

      await tx.visit.update({
        where: { id: examination.visitId },
        data: { status: VisitStatus.COMPLETED },
      });

      return result;
    });

    await this.auditService.log({
      actorId,
      action: 'COMPLETE_EXAMINATION',
      entityType: 'Examination',
      entityId: completed.id,
      after: { visitId: completed.visitId, completedAt: completed.completedAt },
    });

    return completed;
  }
}
