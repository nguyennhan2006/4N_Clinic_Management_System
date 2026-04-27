import { Injectable } from '@nestjs/common';

@Injectable()
export class ReportsService {
  getMonthlySummary() {
    return {
      success: true,
      data: {
        month: null,
        summary: null,
      },
    };
  }
}
