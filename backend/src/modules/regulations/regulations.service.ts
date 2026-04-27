import { Injectable } from '@nestjs/common';

@Injectable()
export class RegulationsService {
  getCurrent() {
    return { success: true, data: null };
  }
}
