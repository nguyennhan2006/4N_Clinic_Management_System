import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
