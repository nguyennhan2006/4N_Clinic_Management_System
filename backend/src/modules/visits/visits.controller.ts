import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateVisitDto } from './dto/create-visit.dto';
import { VisitsService } from './visits.service';

@Controller('visits')
@UseGuards(JwtAuthGuard)
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Post()
  create(@Body() dto: CreateVisitDto, @CurrentUser() user: { sub: string }) {
    return this.visitsService.create(dto, user.sub);
  }

  @Get()
  findAll(@Query('date') date?: string) {
    return this.visitsService.findAll(date);
  }

  @Post(':id/open-examination')
  openExamination(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.visitsService.openExamination(id, user.sub);
  }
}
