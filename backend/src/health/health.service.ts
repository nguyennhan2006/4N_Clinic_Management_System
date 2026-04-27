import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  getHealth() {
    return {
      status: 'ok',
      service: '4N_Clinic_Management_System Backend',
      timestamp: new Date().toISOString(),
    };
  }
}
