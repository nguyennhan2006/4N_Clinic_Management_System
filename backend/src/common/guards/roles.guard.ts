import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { RoleName } from '../constants/roles.constant';
import { CurrentUserPayload } from '../decorators/current-user.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';

type AuthenticatedRequest = Request & {
  user?: CurrentUserPayload;
};

// Phải chạy SAU JwtAuthGuard (JwtAuthGuard set request.user trước)
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userRoles = request.user?.roles;

    if (
      !userRoles ||
      !userRoles.some((r) => requiredRoles.includes(r as RoleName))
    ) {
      throw new ForbiddenException('Insufficient role permission');
    }

    return true;
  }
}
