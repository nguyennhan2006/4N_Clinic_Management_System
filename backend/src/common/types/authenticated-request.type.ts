import { Request } from 'express';
import { CurrentUserPayload } from '../decorators/current-user.decorator';

export type AuthenticatedRequest = Request & {
  user?: CurrentUserPayload;
};
