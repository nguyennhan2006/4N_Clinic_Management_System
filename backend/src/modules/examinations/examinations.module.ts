import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ExaminationsController } from './examinations.controller';
import { ExaminationsService } from './examinations.service';

@Module({
  imports: [AuditModule],
  controllers: [ExaminationsController],
  providers: [ExaminationsService],
})
export class ExaminationsModule {}
