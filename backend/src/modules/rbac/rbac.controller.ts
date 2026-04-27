import { Controller, Get } from '@nestjs/common';
import { RbacService } from './rbac.service';

@Controller()
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Get('roles')
  getRoles() {
    return this.rbacService.getRoles();
  }

  @Get('permissions')
  getPermissions() {
    return this.rbacService.getPermissions();
  }
}
