import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogParams, AuditService } from '../audit/audit.service';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';

@Injectable()
export class RbacService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAllRoles() {
    return this.prisma.role.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        createdAt: true,
        rolePermissions: {
          select: {
            permission: {
              select: { id: true, code: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findAllPermissions() {
    return this.prisma.permission.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        createdAt: true,
      },
      orderBy: { code: 'asc' },
    });
  }

  async updateRolePermissions(
    roleId: string,
    dto: UpdateRolePermissionsDto,
    actorId?: string,
  ) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          select: { permission: { select: { code: true } } },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role not found: ${roleId}`);
    }

    // Validate all permissionIds exist
    if (dto.permissionIds.length > 0) {
      const found = await this.prisma.permission.findMany({
        where: { id: { in: dto.permissionIds } },
        select: { id: true },
      });

      if (found.length !== dto.permissionIds.length) {
        const foundIds = new Set(found.map((p) => p.id));
        const missing = dto.permissionIds.filter((id) => !foundIds.has(id));
        throw new BadRequestException(
          `Permission IDs not found: ${missing.join(', ')}`,
        );
      }
    }

    const before = role.rolePermissions.map((rp) => rp.permission.code);

    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId } }),
      ...(dto.permissionIds.length > 0
        ? [
            this.prisma.rolePermission.createMany({
              data: dto.permissionIds.map((permissionId) => ({
                roleId,
                permissionId,
              })),
            }),
          ]
        : []),
    ]);

    const updated = await this.prisma.role.findUnique({
      where: { id: roleId },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        rolePermissions: {
          select: {
            permission: { select: { id: true, code: true, name: true } },
          },
        },
      },
    });

    if (actorId) {
      const after = (updated?.rolePermissions ?? []).map(
        (rp) => rp.permission.code,
      );

      const logParams: AuditLogParams = {
        actorId,
        action: 'RBAC_ROLE_UPDATE_PERMISSIONS',
        entityType: 'Role',
        entityId: roleId,
        before: { permissions: before },
        after: { permissions: after },
      };
      await this.auditService.log(logParams);
    }

    return updated;
  }
}
