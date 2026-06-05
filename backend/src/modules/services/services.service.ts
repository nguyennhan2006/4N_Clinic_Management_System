import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ServiceOrderStatus } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateServiceCatalogDto,
  UpdateServiceCatalogDto,
} from './dto/create-service-catalog.dto';
import {
  CreateServiceOrderDto,
  QueryServiceOrdersDto,
} from './dto/create-service-order.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Service Catalog ──────────────────────────────────────────────────────

  async listCatalog(type?: string) {
    return this.prisma.serviceCatalog.findMany({
      where: { ...(type ? { type: type as never } : {}) },
      include: { labTest: true },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
  }

  async createCatalog(dto: CreateServiceCatalogDto) {
    const existing = await this.prisma.serviceCatalog.findUnique({
      where: { code: dto.code },
    });
    if (existing) throw new ConflictException(`Service code ${dto.code} already exists`);

    return this.prisma.serviceCatalog.create({
      data: {
        code: dto.code,
        name: dto.name,
        type: dto.type,
        price: dto.price,
        isActive: dto.isActive ?? true,
        ...(dto.type === 'LAB_TEST' && dto.labCode
          ? {
              labTest: {
                create: {
                  code: dto.labCode,
                  sampleType: dto.sampleType ?? 'UNKNOWN',
                  referenceRange: dto.referenceRange ?? null,
                },
              },
            }
          : {}),
      },
      include: { labTest: true },
    });
  }

  async updateCatalog(id: string, dto: UpdateServiceCatalogDto) {
    const service = await this.prisma.serviceCatalog.findUnique({ where: { id } });
    if (!service) throw new NotFoundException(`ServiceCatalog ${id} not found`);

    return this.prisma.serviceCatalog.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: { labTest: true },
    });
  }

  // ─── Service Orders ───────────────────────────────────────────────────────

  async listOrders(query: QueryServiceOrdersDto) {
    const where: Record<string, unknown> = {};
    if (query.visitId) where.visitId = query.visitId;
    if (query.examinationId) where.examinationId = query.examinationId;
    if (query.status) where.status = query.status;
    if (query.type) where.service = { type: query.type };

    return this.prisma.serviceOrder.findMany({
      where,
      include: {
        service: true,
        orderedBy: { select: { fullName: true } },
        labOrder: { select: { id: true, status: true } },
      },
      orderBy: { orderedAt: 'desc' },
    });
  }

  async findOrder(id: string) {
    const order = await this.prisma.serviceOrder.findUnique({
      where: { id },
      include: {
        service: true,
        orderedBy: { select: { fullName: true } },
        labOrder: {
          include: {
            samples: true,
            results: true,
          },
        },
      },
    });
    if (!order) throw new NotFoundException(`ServiceOrder ${id} not found`);
    return order;
  }

  async createOrder(dto: CreateServiceOrderDto, actorId: string) {
    // Validate visit tồn tại
    const visit = await this.prisma.visit.findUnique({ where: { id: dto.visitId } });
    if (!visit) throw new NotFoundException(`Visit ${dto.visitId} not found`);

    // BR-SVC-01: ServiceCatalog phải active
    const service = await this.prisma.serviceCatalog.findUnique({
      where: { id: dto.serviceId },
    });
    if (!service) throw new NotFoundException(`ServiceCatalog ${dto.serviceId} not found`);
    if (!service.isActive) {
      throw new BadRequestException(`Service "${service.name}" is not active`);
    }

    // BR-SVC-02: Không chỉ định trùng dịch vụ cùng visit (trừ khi cũ đã CANCELLED)
    const duplicate = await this.prisma.serviceOrder.findFirst({
      where: {
        visitId: dto.visitId,
        serviceId: dto.serviceId,
        status: { not: ServiceOrderStatus.CANCELLED },
      },
    });
    if (duplicate) {
      throw new ConflictException(
        `Service "${service.name}" already ordered for this visit`,
      );
    }

    return this.prisma.serviceOrder.create({
      data: {
        visitId: dto.visitId,
        examinationId: dto.examinationId ?? null,
        serviceId: dto.serviceId,
        orderedById: actorId,
        status: ServiceOrderStatus.ORDERED,
        isRequired: dto.isRequired ?? false,
        priceSnapshot: service.price,
        billingStatus: 'PENDING',
      },
      include: {
        service: true,
        orderedBy: { select: { fullName: true } },
      },
    });
  }

  async updateOrderStatus(id: string, status: ServiceOrderStatus) {
    const order = await this.findOrder(id);

    // Allowed transitions
    const transitions: Record<string, string[]> = {
      ORDERED: ['IN_PROGRESS', 'CANCELLED'],
      IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: [],
    };
    if (!transitions[order.status]?.includes(status)) {
      throw new BadRequestException(
        `Cannot transition service order from ${order.status} to ${status}`,
      );
    }

    return this.prisma.serviceOrder.update({
      where: { id },
      data: { status },
      include: { service: true },
    });
  }
}
