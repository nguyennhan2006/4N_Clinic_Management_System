import { Module } from '@nestjs/common';
import { DiseasesController } from './diseases.controller';
import { DiseasesService } from './diseases.service';

@Module({
  controllers: [DiseasesController],
  providers: [DiseasesService],
})
export class DiseasesModule {}
