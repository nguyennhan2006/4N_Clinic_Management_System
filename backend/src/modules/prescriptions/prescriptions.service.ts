import { Injectable } from '@nestjs/common';

@Injectable()
export class PrescriptionsService {
  upsertFromExamination(
    examinationId: string,
    payload: Record<string, unknown>,
  ) {
    return {
      success: true,
      message: 'Upsert prescription endpoint skeleton ready',
      data: { examinationId, ...payload },
    };
  }

  addItem(prescriptionId: string, payload: Record<string, unknown>) {
    return {
      success: true,
      message: 'Add prescription item endpoint skeleton ready',
      data: { prescriptionId, ...payload },
    };
  }

  updateItem(
    prescriptionId: string,
    itemId: string,
    payload: Record<string, unknown>,
  ) {
    return {
      success: true,
      message: 'Update prescription item endpoint skeleton ready',
      data: { prescriptionId, itemId, ...payload },
    };
  }

  getById(prescriptionId: string) {
    return { success: true, data: { prescriptionId } };
  }
}
