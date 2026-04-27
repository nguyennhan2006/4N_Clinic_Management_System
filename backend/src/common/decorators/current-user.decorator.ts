import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export type CurrentUserPayload = {
  sub: string;
  email: string;
  role: string;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: CurrentUserPayload }>();
    return request.user;
  },
);
