import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { SetDiagnosesDto } from './dto/set-diagnoses.dto';
import { UpdateExaminationDto } from './dto/update-examination.dto';
import { ExaminationsService } from './examinations.service';

@Controller('examinations')
@UseGuards(JwtAuthGuard)
export class ExaminationsController {
  constructor(private readonly examinationsService: ExaminationsService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.examinationsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateExaminationDto) {
    return this.examinationsService.update(id, dto);
  }

  @Put(':id/diagnoses')
  setDiagnoses(@Param('id') id: string, @Body() dto: SetDiagnosesDto) {
    return this.examinationsService.setDiagnoses(id, dto);
  }

  @Post(':id/prescription')
  createPrescription(
    @Param('id') id: string,
    @Body() dto: CreatePrescriptionDto,
  ) {
    return this.examinationsService.createPrescription(id, dto);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string) {
    return this.examinationsService.complete(id);
  }
}
