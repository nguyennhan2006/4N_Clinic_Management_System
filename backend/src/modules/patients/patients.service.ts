import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePatientDto) {
    if (dto.citizenId) {
      const existed = await this.prisma.patient.findUnique({
        where: { citizenId: dto.citizenId },
      });

      if (existed) {
        throw new BadRequestException('Patient citizenId already exists');
      }
    }

    return this.prisma.patient.create({
      data: {
        fullName: dto.fullName,
        dob: dto.dob ? new Date(dto.dob) : undefined,
        gender: dto.gender,
        phone: dto.phone,
        citizenId: dto.citizenId,
        address: dto.address,
      },
    });
  }

  async findAll(keyword?: string) {
    return this.prisma.patient.findMany({
      where: keyword
        ? {
            OR: [
              { fullName: { contains: keyword, mode: 'insensitive' } },
              { phone: { contains: keyword } },
              { citizenId: { contains: keyword } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async findOne(id: string) {
    return this.prisma.patient.findUniqueOrThrow({
      where: { id },
      include: {
        visits: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }
}
