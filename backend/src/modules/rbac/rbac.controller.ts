import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ROLES } from '../../common/constants/roles.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';
import { RbacService } from './rbac.service';

@ApiTags('rbac')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLES.ADMIN)
@Controller('rbac')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Get('roles')
  @ApiOperation({ summary: 'Danh sách vai trò kèm quyền hạn' })
  findAllRoles() {
    return this.rbacService.findAllRoles();
  }

  @Get('permissions')
  @ApiOperation({ summary: 'Danh sách quyền hạn' })
  findAllPermissions() {
    return this.rbacService.findAllPermissions();
  }

  @Patch('roles/:id/permissions')
  @ApiOperation({ summary: 'Cập nhật quyền hạn của vai trò' })
  updateRolePermissions(
    @Param('id') roleId: string,
    @Body() dto: UpdateRolePermissionsDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.rbacService.updateRolePermissions(roleId, dto, user.sub);
  }
}
