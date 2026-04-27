import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  create(@Body() payload: Record<string, unknown>) {
    return this.usersService.create(payload);
  }

  @Put(':id/roles')
  assignRoles(
    @Param('id') userId: string,
    @Body() payload: Record<string, unknown>,
  ) {
    return this.usersService.assignRoles(userId, payload);
  }
}
