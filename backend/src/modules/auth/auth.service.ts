import * as crypto from 'crypto';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

const USER_ROLES_SELECT = {
  userRoles: {
    select: {
      role: { select: { code: true } },
    },
  },
} as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
      include: USER_ROLES_SELECT,
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === 'LOCKED') {
      throw new ForbiddenException('Account is locked');
    }

    if (user.status === 'INACTIVE') {
      throw new ForbiddenException('Account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const roles = user.userRoles
      .map((ur) => ur.role.code)
      .filter(Boolean) as string[];
    const payload = { sub: user.id, username: user.username ?? '', roles };

    const accessToken = await this.jwtService.signAsync(payload);
    const rawRefreshToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    await this.prisma.refreshToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        status: user.status,
        roles,
      },
    };
  }

  async refresh(dto: RefreshTokenDto) {
    const tokenHash = hashToken(dto.refreshToken);

    const stored = await this.prisma.refreshToken.findFirst({
      where: { tokenHash },
      include: {
        user: {
          include: USER_ROLES_SELECT,
        },
      },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (stored.user.status !== 'ACTIVE') {
      throw new ForbiddenException('Account is not active');
    }

    const roles = stored.user.userRoles
      .map((ur) => ur.role.code)
      .filter(Boolean) as string[];

    const payload = {
      sub: stored.userId,
      username: stored.user.username ?? '',
      roles,
    };

    const newRawToken = crypto.randomBytes(64).toString('hex');
    const newHash = hashToken(newRawToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    // Rotate: revoke old, create new
    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: new Date() },
      }),
      this.prisma.refreshToken.create({
        data: { userId: stored.userId, tokenHash: newHash, expiresAt },
      }),
    ]);

    return {
      accessToken: await this.jwtService.signAsync(payload),
      refreshToken: newRawToken,
    };
  }

  async logout(userId: string, dto: LogoutDto) {
    if (dto.refreshToken) {
      const tokenHash = hashToken(dto.refreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { userId, tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } else {
      // Revoke all active tokens for this user
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    return { message: 'Logged out successfully' };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          select: {
            role: {
              select: {
                code: true,
                name: true,
                rolePermissions: {
                  select: { permission: { select: { code: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const roles = user.userRoles
      .map((ur) => ur.role.code)
      .filter(Boolean) as string[];
    const permissions = [
      ...new Set(
        user.userRoles.flatMap((ur) =>
          ur.role.rolePermissions.map((rp) => rp.permission.code),
        ),
      ),
    ];

    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      status: user.status,
      roles,
      permissions,
    };
  }
}
