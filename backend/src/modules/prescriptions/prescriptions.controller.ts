import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';

@Controller()
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post('examinations/:id/prescription')
  upsertFromExamination(
    @Param('id') examinationId: string,
    @Body() payload: Record<string, unknown>,
  ) {
    return this.prescriptionsService.upsertFromExamination(
      examinationId,
      payload,
    );
  }

  @Post('prescriptions/:id/items')
  addItem(
    @Param('id') prescriptionId: string,
    @Body() payload: Record<string, unknown>,
  ) {
    return this.prescriptionsService.addItem(prescriptionId, payload);
  }

  @Patch('prescriptions/:id/items/:itemId')
  updateItem(
    @Param('id') prescriptionId: string,
    @Param('itemId') itemId: string,
    @Body() payload: Record<string, unknown>,
  ) {
    return this.prescriptionsService.updateItem(
      prescriptionId,
      itemId,
      payload,
    );
  }

  @Get('prescriptions/:id')
  getById(@Param('id') prescriptionId: string) {
    return this.prescriptionsService.getById(prescriptionId);
  }
}
