import { Controller, Get } from '@nestjs/common';
import { StatusService } from './status.service';

@Controller('status')
export class StatusController {
  constructor(private readonly statsService: StatusService) {}

  @Get('home')
  async getStats() {
    return this.statsService.getPublicStats();
  }
}