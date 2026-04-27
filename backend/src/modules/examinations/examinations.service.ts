import { BadRequestException, Injectable } from '@nestjs/common';
import { ExaminationStatus, VisitStatus } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { SetDiagnosesDto } from './dto/set-diagnoses.dto';
import { UpdateExaminationDto } from './dto/update-examination.dto';

@Injectable()
export class ExaminationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: string) {
    return this.prisma.examination.findUniqueOrThrow({
      where: { id },
      include: {
        visit: {
          include: {
            patient: true,
          },
        },
        diagnoses: true,
        prescription: {
          include: {
            items: {
              include: {
                drug: true,
              },
            },
          },
        },
      },
    });
  }

  async update(id: string, dto: UpdateExaminationDto) {
    const examination = await this.prisma.examination.findUnique({
      where: { id },
    });

    if (!examination) {
      throw new BadRequestException('Examination not found');
    }

    if (examination.status === ExaminationStatus.COMPLETED) {
      throw new BadRequestException('Completed examination cannot be edited');
    }

    return this.prisma.examination.update({
      where: { id },
      data: dto,
    });
  }

  async setDiagnoses(id: string, dto: SetDiagnosesDto) {
    const examination = await this.prisma.examination.findUnique({
      where: { id },
    });

    if (!examination) {
      throw new BadRequestException('Examination not found');
    }

    if (examination.status === ExaminationStatus.COMPLETED) {
      throw new BadRequestException('Completed examination cannot be edited');
    }

    const primaryCount = dto.diagnoses.filter((d) => d.isPrimary).length;

    if (primaryCount !== 1) {
      throw new BadRequestException(
        'Exactly one primary diagnosis is required',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.diagnosis.deleteMany({
        where: { examinationId: id },
      });

      await tx.diagnosis.createMany({
        data: dto.diagnoses.map((diagnosis) => ({
          examinationId: id,
          name: diagnosis.name,
          isPrimary: diagnosis.isPrimary,
        })),
      });

      return tx.examination.findUniqueOrThrow({
        where: { id },
        include: { diagnoses: true },
      });
    });
  }

  async createPrescription(id: string, dto: CreatePrescriptionDto) {
    const examination = await this.prisma.examination.findUnique({
      where: { id },
      include: { prescription: true },
    });

    if (!examination) {
      throw new BadRequestException('Examination not found');
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
        where: {
          id: { in: drugIds },
          isActive: true,
        },
      });

      if (drugs.length !== drugIds.length) {
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
          items: {
            include: {
              drug: true,
            },
          },
        },
      });
    });
  }

  async complete(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const examination = await tx.examination.findUnique({
        where: { id },
        include: {
          diagnoses: true,
        },
      });

      if (!examination) {
        throw new BadRequestException('Examination not found');
      }

      if (examination.status === ExaminationStatus.COMPLETED) {
        return examination;
      }

      if (!examination.symptoms || !examination.conclusion) {
        throw new BadRequestException(
          'Symptoms and conclusion are required before completing examination',
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

      const completed = await tx.examination.update({
        where: { id },
        data: {
          status: ExaminationStatus.COMPLETED,
          completedAt: new Date(),
        },
        include: {
          diagnoses: true,
          prescription: {
            include: {
              items: true,
            },
          },
        },
      });

      await tx.visit.update({
        where: { id: examination.visitId },
        data: {
          status: VisitStatus.COMPLETED,
        },
      });

      return completed;
    });
  }
}
