import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { CurrentUserPayload } from '../decorators/current-user.decorator';

type AuthenticatedRequest = Request & {
  user?: CurrentUserPayload;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const headerValue = request.headers.authorization;
    const authHeader =
      typeof headerValue === 'string' ? headerValue : headerValue?.[0];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing access token');
    }

    const token = authHeader.replace('Bearer ', '').trim();

    try {
      const payload = await this.jwtService.verifyAsync<CurrentUserPayload>(
        token,
        {
          secret:
            process.env.JWT_ACCESS_SECRET || 'dev_access_secret_change_me',
        },
      );

      request.user = payload;

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
