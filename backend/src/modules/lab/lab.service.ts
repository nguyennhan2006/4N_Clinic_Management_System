import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LabOrderStatus } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateLabOrderDto } from './dto/create-lab-order.dto';
import { CreateLabResultDto } from './dto/create-lab-result.dto';
import { QueryLabOrdersDto } from './dto/query-lab-orders.dto';
import { UpdateLabSampleDto } from './dto/update-lab-sample.dto';

@Injectable()
export class LabService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async createOrder(dto: CreateLabOrderDto, actorId: string) {
    // BR-LAB-01: ServiceOrder phải có type=LAB_TEST
    const serviceOrder = await this.prisma.serviceOrder.findUnique({
      where: { id: dto.serviceOrderId },
      include: { service: true },
    });
    if (!serviceOrder) {
      throw new NotFoundException(`ServiceOrder ${dto.serviceOrderId} not found`);
    }
    if (serviceOrder.service.type !== 'LAB_TEST') {
      throw new BadRequestException('LabOrder can only be created from LAB_TEST service orders');
    }
    if (serviceOrder.status === 'CANCELLED') {
      throw new BadRequestException('Cannot create lab order for a cancelled service order');
    }

    // LabOrder phải unique per serviceOrder
    const existing = await this.prisma.labOrder.findUnique({
      where: { serviceOrderId: dto.serviceOrderId },
    });
    if (existing) {
      throw new ConflictException('Lab order already exists for this service order');
    }

    // Validate LabTestCatalog tồn tại
    const labTest = await this.prisma.labTestCatalog.findUnique({
      where: { id: dto.labTestId },
    });
    if (!labTest) throw new NotFoundException(`LabTestCatalog ${dto.labTestId} not found`);

    return this.prisma.$transaction(async (tx) => {
      const labOrder = await tx.labOrder.create({
        data: {
          serviceOrderId: dto.serviceOrderId,
          labTestId: dto.labTestId,
          status: LabOrderStatus.ORDERED,
        },
        include: {
          serviceOrder: { include: { service: true } },
          labTest: true,
        },
      });

      // Cập nhật service order → IN_PROGRESS
      await tx.serviceOrder.update({
        where: { id: dto.serviceOrderId },
        data: { status: 'IN_PROGRESS' },
      });

      return labOrder;
    });
  }

  async listOrders(query: QueryLabOrdersDto) {
    const where: Record<string, unknown> = {};

    if (query.status) where.status = query.status;
    if (query.visitId) {
      where.serviceOrder = { visitId: query.visitId };
    }
    if (query.date) {
      const day = new Date(query.date);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      where.createdAt = { gte: day, lt: nextDay };
    }

    return this.prisma.labOrder.findMany({
      where,
      include: {
        serviceOrder: {
          include: {
            service: true,
            visit: {
              include: { patient: { select: { id: true, fullName: true } } },
            },
          },
        },
        labTest: true,
        samples: { include: { collectedBy: { select: { fullName: true } } } },
        results: { include: { enteredBy: { select: { fullName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOrder(id: string) {
    const order = await this.prisma.labOrder.findUnique({
      where: { id },
      include: {
        serviceOrder: {
          include: {
            service: true,
            visit: {
              include: { patient: { select: { id: true, fullName: true, phone: true } } },
            },
          },
        },
        labTest: true,
        samples: { include: { collectedBy: { select: { fullName: true } } } },
        results: {
          include: {
            enteredBy: { select: { fullName: true } },
            verifiedBy: { select: { fullName: true } },
          },
        },
      },
    });
    if (!order) throw new NotFoundException(`LabOrder ${id} not found`);
    return order;
  }

  async collectSample(id: string, dto: UpdateLabSampleDto, actorId: string) {
    const order = await this.findOrder(id);

    if (order.status === LabOrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot collect sample for a cancelled lab order');
    }
    if (order.status !== LabOrderStatus.ORDERED) {
      throw new BadRequestException('Sample can only be collected when lab order is ORDERED');
    }

    return this.prisma.$transaction(async (tx) => {
      // Tạo LabSample
      await tx.labSample.create({
        data: {
          labOrderId: id,
          collectedById: actorId,
          sampleType: dto.sampleType ?? order.labTest.sampleType,
          status: 'COLLECTED',
          collectedAt: dto.collectedAt ? new Date(dto.collectedAt) : new Date(),
          note: dto.note ?? null,
        },
      });

      // Cập nhật lab order → SAMPLE_COLLECTED
      const updated = await tx.labOrder.update({
        where: { id },
        data: { status: LabOrderStatus.SAMPLE_COLLECTED },
        include: {
          samples: true,
          labTest: true,
          serviceOrder: { include: { service: true } },
        },
      });

      return updated;
    });
  }

  async submitResult(id: string, dto: CreateLabResultDto, actorId: string) {
    const order = await this.findOrder(id);

    // BR-LAB-02: phải đã lấy mẫu trước khi nhập kết quả
    if (order.status !== LabOrderStatus.SAMPLE_COLLECTED) {
      throw new BadRequestException(
        'Sample must be collected before entering results (current status: ' + order.status + ')',
      );
    }

    // BR-LAB-04: Kết quả không được sửa sau khi đã nhập (immutable)
    const existingResult = await this.prisma.labResult.findFirst({
      where: { labOrderId: id, status: { not: 'CANCELLED' } },
    });
    if (existingResult) {
      throw new ConflictException('Lab result already entered and is immutable');
    }

    if (!dto.resultText && dto.resultValue === undefined) {
      throw new BadRequestException('Either resultText or resultValue must be provided');
    }

    return this.prisma.$transaction(async (tx) => {
      const result = await tx.labResult.create({
        data: {
          labOrderId: id,
          enteredById: actorId,
          resultText: dto.resultText ?? null,
          resultValue: dto.resultValue ?? null,
          unit: dto.unit ?? null,
          referenceRange: dto.referenceRange ?? order.labTest.referenceRange ?? null,
          status: 'RESULT_ENTERED',
          enteredAt: new Date(),
        },
      });

      // Cập nhật lab order → RESULT_ENTERED
      await tx.labOrder.update({
        where: { id },
        data: { status: LabOrderStatus.RESULT_ENTERED },
      });

      // Cập nhật service order → COMPLETED
      await tx.serviceOrder.update({
        where: { id: order.serviceOrderId },
        data: { status: 'COMPLETED', billingStatus: 'READY' },
      });

      await this.audit.log({
        actorId,
        action: 'SUBMIT_LAB_RESULT',
        entityType: 'LabResult',
        entityId: result.id,
        after: { labOrderId: id, status: 'RESULT_ENTERED' },
      });

      return result;
    });
  }

  async verifyResult(labOrderId: string, actorId: string) {
    const order = await this.findOrder(labOrderId);

    if (order.status !== LabOrderStatus.RESULT_ENTERED) {
      throw new BadRequestException('Lab order must have result entered before verifying');
    }

    const result = await this.prisma.labResult.findFirst({
      where: { labOrderId, status: 'RESULT_ENTERED' },
    });
    if (!result) throw new NotFoundException('Lab result not found');

    return this.prisma.$transaction(async (tx) => {
      await tx.labResult.update({
        where: { id: result.id },
        data: { status: 'VERIFIED', verifiedById: actorId, verifiedAt: new Date() },
      });

      return tx.labOrder.update({
        where: { id: labOrderId },
        data: { status: LabOrderStatus.VERIFIED },
        include: { results: true, labTest: true },
      });
    });
  }

  async getResult(labOrderId: string) {
    const order = await this.findOrder(labOrderId);
    const results = await this.prisma.labResult.findMany({
      where: { labOrderId },
      include: {
        enteredBy: { select: { fullName: true } },
        verifiedBy: { select: { fullName: true } },
      },
      orderBy: { enteredAt: 'desc' },
    });
    return { labOrder: order, results };
  }
}
