import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateDrugDto } from './dto/create-drug.dto';
import { UpdateDrugDto } from './dto/update-drug.dto';

@Injectable()
export class DrugsService {
  constructor(private readonly prisma: PrismaService) {}

  // UC-19: Danh sách thuốc
  async findAll(onlyActive?: boolean) {
    return this.prisma.drug.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        unit: true,
        price: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  // UC-19: Thêm thuốc
  async create(dto: CreateDrugDto) {
    const existing = await this.prisma.drug.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new BadRequestException(`Drug name '${dto.name}' already exists`);
    }

    return this.prisma.drug.create({
      data: { name: dto.name, unit: dto.unit, price: dto.price },
      select: {
        id: true,
        name: true,
        unit: true,
        price: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  // UC-19: Cập nhật thuốc
  async update(id: string, dto: UpdateDrugDto) {
    const drug = await this.prisma.drug.findUnique({ where: { id } });

    if (!drug) {
      throw new NotFoundException('Drug not found');
    }

    return this.prisma.drug.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        name: true,
        unit: true,
        price: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }
}
