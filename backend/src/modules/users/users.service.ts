import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma, UserStatus } from '@prisma/client';

import { ROLES } from '../../common/constants/roles.constant';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { LockUserDto } from './dto/lock-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// Fields returned for all user responses — passwordHash is intentionally excluded
const USER_SELECT = {
  id: true,
  username: true,
  fullName: true,
  email: true,
  phone: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  userRoles: {
    select: {
      role: { select: { id: true, code: true, name: true } },
    },
  },
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(query: QueryUsersDto) {
    const { keyword, status, role, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      ...(keyword
        ? {
            OR: [
              { username: { contains: keyword, mode: 'insensitive' } },
              { fullName: { contains: keyword, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(status ? { status } : {}),
      ...(role ? { userRoles: { some: { role: { code: role } } } } : {}),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: USER_SELECT,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data: users, total, page, limit };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });

    if (!user) {
      throw new NotFoundException(`User not found: ${id}`);
    }

    return user;
  }

  async create(dto: CreateUserDto, actorId?: string) {
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(`Username already exists: ${dto.username}`);
    }

    if (dto.roleIds && dto.roleIds.length > 0) {
      await this.validateRoleIds(dto.roleIds);
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          username: dto.username,
          passwordHash,
          fullName: dto.fullName,
          email: dto.email ?? null,
          phone: dto.phone ?? null,
        },
        select: USER_SELECT,
      });

      if (dto.roleIds && dto.roleIds.length > 0) {
        await tx.userRole.createMany({
          data: dto.roleIds.map((roleId) => ({
            userId: created.id,
            roleId,
          })),
        });
      }

      return created;
    });

    if (actorId) {
      await this.auditService.log({
        actorId,
        action: 'USER_CREATE',
        entityType: 'User',
        entityId: user.id,
        after: { username: dto.username, fullName: dto.fullName },
      });
    }

    // Re-fetch to include roles assigned in transaction
    return this.findOne(user.id);
  }

  async update(id: string, dto: UpdateUserDto, actorId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, status: true, fullName: true },
    });

    if (!user) {
      throw new NotFoundException(`User not found: ${id}`);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.fullName !== undefined ? { fullName: dto.fullName } : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
      select: USER_SELECT,
    });

    if (actorId) {
      await this.auditService.log({
        actorId,
        action: 'USER_UPDATE',
        entityType: 'User',
        entityId: id,
        after: dto as Record<string, unknown>,
      });
    }

    return updated;
  }

  async lock(id: string, dto: LockUserDto, actorId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        userRoles: { select: { role: { select: { code: true } } } },
      },
    });

    if (!user) {
      throw new NotFoundException(`User not found: ${id}`);
    }

    if (dto.locked) {
      const isAdmin = user.userRoles.some((ur) => ur.role.code === ROLES.ADMIN);
      if (isAdmin) {
        await this.ensureNotLastAdmin(id);
      }
    }

    const newStatus: UserStatus = dto.locked ? 'LOCKED' : 'ACTIVE';

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: newStatus },
      select: USER_SELECT,
    });

    if (actorId) {
      await this.auditService.log({
        actorId,
        action: dto.locked ? 'USER_LOCK' : 'USER_UNLOCK',
        entityType: 'User',
        entityId: id,
        before: { status: user.status },
        after: { status: newStatus },
      });
    }

    return updated;
  }

  async assignRoles(id: string, dto: AssignRolesDto, actorId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        userRoles: { select: { role: { select: { id: true, code: true } } } },
      },
    });

    if (!user) {
      throw new NotFoundException(`User not found: ${id}`);
    }

    if (dto.roleIds.length > 0) {
      await this.validateRoleIds(dto.roleIds);
    }

    // Guard: if removing admin role from the last active admin
    const adminRole = await this.prisma.role.findUnique({
      where: { code: ROLES.ADMIN },
      select: { id: true },
    });

    if (adminRole) {
      const isCurrentlyAdmin = user.userRoles.some(
        (ur) => ur.role.code === ROLES.ADMIN,
      );
      const willStillBeAdmin = dto.roleIds.includes(adminRole.id);

      if (isCurrentlyAdmin && !willStillBeAdmin) {
        await this.ensureNotLastAdmin(id);
      }
    }

    const beforeRoles = user.userRoles.map((ur) => ur.role.code);

    await this.prisma.$transaction([
      this.prisma.userRole.deleteMany({ where: { userId: id } }),
      ...(dto.roleIds.length > 0
        ? [
            this.prisma.userRole.createMany({
              data: dto.roleIds.map((roleId) => ({ userId: id, roleId })),
            }),
          ]
        : []),
    ]);

    const updated = await this.findOne(id);

    if (actorId) {
      await this.auditService.log({
        actorId,
        action: 'USER_ASSIGN_ROLE',
        entityType: 'User',
        entityId: id,
        before: { roles: beforeRoles },
        after: {
          roles: updated.userRoles.map((ur) => ur.role.code),
        },
      });
    }

    return updated;
  }

  private async validateRoleIds(roleIds: string[]): Promise<void> {
    const found = await this.prisma.role.findMany({
      where: { id: { in: roleIds } },
      select: { id: true },
    });

    if (found.length !== roleIds.length) {
      const foundIds = new Set(found.map((r) => r.id));
      const missing = roleIds.filter((id) => !foundIds.has(id));
      throw new BadRequestException(
        `Role IDs not found: ${missing.join(', ')}`,
      );
    }
  }

  private async ensureNotLastAdmin(excludeUserId: string): Promise<void> {
    const otherActiveAdminCount = await this.prisma.userRole.count({
      where: {
        role: { code: ROLES.ADMIN },
        user: { status: UserStatus.ACTIVE },
        userId: { not: excludeUserId },
      },
    });

    if (otherActiveAdminCount === 0) {
      throw new BadRequestException(
        'Cannot remove the last active admin from the system',
      );
    }
  }
}
