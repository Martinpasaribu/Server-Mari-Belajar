/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Controller, Post, Body, Param, Get, Request, UseGuards, HttpStatus } from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { StartAttemptDto, SubmitAttemptDto } from './dto/create-attempt.dto';
import { randomUUID } from 'crypto';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AccessGuard } from '../../common/guards/access.guard';

@ApiTags('Attempts')
@Controller('attempts')
@UseGuards(AuthGuard('jwt')) // Guard 1: Cek Login
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  /**
   * 1. Mulai Kuis (Create record 'in_progress')
   */
  @Post('start/:id')
  @UseGuards(AccessGuard) // Guard 2: Cek apakah user sudah beli/enroll bab ini
  async start(@Param('id') id: string, @Body() dto: StartAttemptDto, @Request() req: any) {

    // Jika user login, ambil ID-nya. Jika tidak (guest), gunakan string 'GUEST'
    const userId = req.user?.userId || req.user?.id || 'GUEST';

    const data = await this.attemptsService.startAttempt(userId, id);

    return {
      success: true,
      message: 'Kuis dimulai, selamat mengerjakan!',
      uuid_req: randomUUID(),
      data,
    };
  }

  /**
   * 2. Submit Jawaban (Kalkulasi Skor)
   */
  @Post(':id/submit')
  async submit(@Param('id') id: string, @Body() dto: SubmitAttemptDto, @Request() req: any) {
    
    const userId = req.user?.userId || req.user?.id || 'GUEST';

    const data = await this.attemptsService.submitAttempt(id, userId, dto.answers);

    return {
      success: true,
      message: 'Jawaban berhasil dikirim dan dinilai.',
      uuid_req: randomUUID(),
      data,
    };
  }

  /**
   * 3. Ambil Hasil Detail (Untuk Score Card)
   */
  @Get(':id/result')
  async getResult(@Param('id') id: string) {
    const data = await this.attemptsService.getResult(id);
    
    return {
      success: true,
      message: 'Berhasil memuat hasil kuis.',
      uuid_req: randomUUID(),
      data,
    };
  }
}