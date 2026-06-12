import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateDiseaseDto } from './dto/create-disease.dto';
import { UpdateDiseaseDto } from './dto/update-disease.dto';

@Injectable()
export class DiseasesService {
  constructor(private readonly prisma: PrismaService) {}

  // UC-18: Danh sách bệnh
  async findAll(onlyActive?: boolean) {
    return this.prisma.disease.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      orderBy: { code: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  // UC-18: Thêm bệnh
  async create(dto: CreateDiseaseDto) {
    const existing = await this.prisma.disease.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new BadRequestException(
        `Disease code '${dto.code}' already exists`,
      );
    }

    return this.prisma.disease.create({
      data: { code: dto.code, name: dto.name },
      select: {
        id: true,
        code: true,
        name: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  // UC-18: Cập nhật bệnh
  async update(id: string, dto: UpdateDiseaseDto) {
    const disease = await this.prisma.disease.findUnique({ where: { id } });

    if (!disease) {
      throw new NotFoundException('Disease not found');
    }

    return this.prisma.disease.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        code: true,
        name: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }
}
