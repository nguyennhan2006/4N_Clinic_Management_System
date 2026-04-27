import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  findAll() {
    return {
      success: true,
      data: [],
    };
  }

  create(payload: Record<string, unknown>) {
    return {
      success: true,
      message: 'Create user endpoint skeleton ready',
      data: payload,
    };
  }

  assignRoles(userId: string, payload: Record<string, unknown>) {
    return {
      success: true,
      message: 'Assign role endpoint skeleton ready',
      data: { userId, ...payload },
    };
  }
}
