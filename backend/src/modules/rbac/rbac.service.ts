import { Injectable } from '@nestjs/common';

@Injectable()
export class RbacService {
  getRoles() {
    return {
      success: true,
      data: [],
    };
  }

  getPermissions() {
    return {
      success: true,
      data: [],
    };
  }
}
