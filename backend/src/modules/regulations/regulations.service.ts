import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateRegulationDto } from './dto/create-regulation.dto';

@Injectable()
export class RegulationsService {
  constructor(private readonly prisma: PrismaService) {}

  // UC-17: Xem quy định đang hiệu lực
  async getCurrent() {
    const version = await this.prisma.regulationVersion.findFirst({
      where: { isActive: true },
      include: { items: true },
      orderBy: { activatedAt: 'desc' },
    });

    if (!version) {
      throw new NotFoundException('No active regulation version found');
    }

    return version;
  }

  // UC-17: Tạo bản quy định mới (draft)
  async create(dto: CreateRegulationDto) {
    const keys = dto.items.map((i) => i.key);
    const uniqueKeys = new Set(keys);

    if (uniqueKeys.size !== keys.length) {
      throw new BadRequestException('Duplicate keys in regulation items');
    }

    return this.prisma.regulationVersion.create({
      data: {
        note: dto.note,
        isActive: false,
        items: {
          create: dto.items.map((item) => ({
            key: item.key,
            value: item.value,
          })),
        },
      },
      include: { items: true },
    });
  }

  // UC-17: Kích hoạt bản quy định
  async activate(id: string) {
    const version = await this.prisma.regulationVersion.findUnique({
      where: { id },
    });

    if (!version) {
      throw new NotFoundException('Regulation version not found');
    }

    if (version.isActive) {
      throw new BadRequestException('Version is already active');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.regulationVersion.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });

      return tx.regulationVersion.update({
        where: { id },
        data: { isActive: true, activatedAt: new Date() },
        include: { items: true },
      });
    });
  }
}
