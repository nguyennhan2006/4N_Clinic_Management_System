import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { VitalsController } from './vitals.controller';
import { VitalsService } from './vitals.service';

@Module({
  imports: [PrismaModule],
  controllers: [VitalsController],
  providers: [VitalsService],
  exports: [VitalsService],
})
export class VitalsModule {}
