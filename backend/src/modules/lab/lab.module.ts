import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { LabController } from './lab.controller';
import { LabService } from './lab.service';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [LabController],
  providers: [LabService],
  exports: [LabService],
})
export class LabModule {}
