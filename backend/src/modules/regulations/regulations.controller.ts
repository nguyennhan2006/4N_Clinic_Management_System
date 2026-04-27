import { Controller, Get } from '@nestjs/common';
import { RegulationsService } from './regulations.service';

@Controller('regulations')
export class RegulationsController {
  constructor(private readonly regulationsService: RegulationsService) {}

  @Get('current')
  getCurrent() {
    return this.regulationsService.getCurrent();
  }
}
