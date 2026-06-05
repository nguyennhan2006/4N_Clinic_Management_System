import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateVitalSignDto } from './dto/create-vital-sign.dto';

const MEASUREMENT_FIELDS = [
  'pulse',
  'systolicBp',
  'diastolicBp',
  'temperature',
  'spo2',
  'heightCm',
  'weightKg',
] as const;

@Injectable()
export class VitalsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateVitalSignDto, actorId: string) {
    // BR-VS-02: ít nhất 1 field đo lường
    const hasAny = MEASUREMENT_FIELDS.some((f) => dto[f] !== undefined);
    if (!hasAny) {
      throw new BadRequestException(
        'At least one measurement field (pulse, systolicBp, diastolicBp, temperature, spo2, heightCm, weightKg) must be provided',
      );
    }

    // BR-VS-01: Visit không được COMPLETED
    const visit = await this.prisma.visit.findUnique({
      where: { id: dto.visitId },
    });
    if (!visit) throw new NotFoundException(`Visit ${dto.visitId} not found`);
    if (visit.status === 'COMPLETED') {
      throw new BadRequestException(
        'Cannot record vital signs for a COMPLETED visit',
      );
    }

    // Tính BMI nếu có đủ cả chiều cao lẫn cân nặng
    let bmi: number | undefined;
    if (dto.heightCm && dto.weightKg && dto.heightCm > 0) {
      const heightM = dto.heightCm / 100;
      bmi = Math.round((dto.weightKg / (heightM * heightM)) * 10) / 10;
    }

    // VitalSign là 1:1 với Visit — upsert nếu đã tồn tại
    return this.prisma.vitalSign.upsert({
      where: { visitId: dto.visitId },
      create: {
        visitId: dto.visitId,
        measuredById: actorId,
        pulse: dto.pulse ?? null,
        systolicBp: dto.systolicBp ?? null,
        diastolicBp: dto.diastolicBp ?? null,
        temperature: dto.temperature ?? null,
        spo2: dto.spo2 ?? null,
        heightCm: dto.heightCm ?? null,
        weightKg: dto.weightKg ?? null,
        bmi: bmi ?? null,
        note: dto.note ?? null,
      },
      update: {
        measuredById: actorId,
        ...(dto.pulse !== undefined && { pulse: dto.pulse }),
        ...(dto.systolicBp !== undefined && { systolicBp: dto.systolicBp }),
        ...(dto.diastolicBp !== undefined && { diastolicBp: dto.diastolicBp }),
        ...(dto.temperature !== undefined && { temperature: dto.temperature }),
        ...(dto.spo2 !== undefined && { spo2: dto.spo2 }),
        ...(dto.heightCm !== undefined && { heightCm: dto.heightCm }),
        ...(dto.weightKg !== undefined && { weightKg: dto.weightKg }),
        ...(bmi !== undefined && { bmi }),
        ...(dto.note !== undefined && { note: dto.note }),
        measuredAt: new Date(),
      },
      include: {
        measuredBy: { select: { fullName: true } },
      },
    });
  }

  async getByVisit(visitId: string) {
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
    });
    if (!visit) throw new NotFoundException(`Visit ${visitId} not found`);

    return this.prisma.vitalSign.findUnique({
      where: { visitId },
      include: {
        measuredBy: { select: { fullName: true } },
      },
    });
  }
}
