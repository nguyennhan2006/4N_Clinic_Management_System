import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ROLES } from '../../common/constants/roles.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { LockUserDto } from './dto/lock-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLES.ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách người dùng (có phân trang)' })
  findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết người dùng' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo người dùng mới' })
  create(@Body() dto: CreateUserDto, @CurrentUser() user: { sub: string }) {
    return this.usersService.create(dto, user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin người dùng' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.usersService.update(id, dto, user.sub);
  }

  @Patch(':id/lock')
  @ApiOperation({ summary: 'Khóa hoặc mở khóa tài khoản' })
  lock(
    @Param('id') id: string,
    @Body() dto: LockUserDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.usersService.lock(id, dto, user.sub);
  }

  @Patch(':id/roles')
  @ApiOperation({ summary: 'Gán vai trò cho người dùng (thay thế toàn bộ)' })
  assignRoles(
    @Param('id') id: string,
    @Body() dto: AssignRolesDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.usersService.assignRoles(id, dto, user.sub);
  }
}
