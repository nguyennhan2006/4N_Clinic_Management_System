import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ROLES } from '../../common/constants/roles.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Làm mới access token' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    ROLES.ADMIN,
    ROLES.RECEPTIONIST,
    ROLES.DOCTOR,
    ROLES.CASHIER,
    ROLES.MANAGER,
  )
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đăng xuất' })
  logout(@CurrentUser() user: { sub: string }, @Body() dto: LogoutDto) {
    return this.authService.logout(user.sub, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    ROLES.ADMIN,
    ROLES.RECEPTIONIST,
    ROLES.DOCTOR,
    ROLES.CASHIER,
    ROLES.MANAGER,
  )
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Thông tin tài khoản hiện tại' })
  me(@CurrentUser() user: { sub: string }) {
    return this.authService.me(user.sub);
  }
}
