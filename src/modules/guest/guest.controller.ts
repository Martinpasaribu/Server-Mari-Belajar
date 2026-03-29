/* eslint-disable @typescript-eslint/no-unused-vars */
import { Controller, Get, Post, Body, Patch, Param, Delete, Request } from '@nestjs/common';
import { GuestService } from './guest.service';
import { CreateGuestDto } from './dto/create-guest.dto';
import { ApiTags } from '@nestjs/swagger';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { StartAttemptDto, SubmitAttemptDto } from '../attempts/dto/create-attempt.dto';
import { randomUUID } from 'crypto';

@ApiTags('GuestAttempts')
@Controller('guest')
export class GuestController {
  constructor(private readonly guestService: GuestService) {}

  @Post('attempts/start/:id')
  async start(@Param('id') id: string, @Body() dto: StartAttemptDto, @Request() req: any) {

    const data = await this.guestService.startAttempt('GUEST', id);

    return {
      success: true,
      message: 'Kuis guest dimulai, selamat mengerjakan!',
      uuid_req: randomUUID(),
      data,
    };
  }

  /**
   * 2. Submit Jawaban (Kalkulasi Skor)
   */
  @Post('/attempts/:id/submit')
  async submit(@Param('id') id: string, @Body() dto: SubmitAttemptDto, @Request() req: any) {
    
    const userId = 'GUEST';

    const data = await this.guestService.submitAttempt(id, userId, dto.answers);

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
  @Get('/attempts/:id/result')
    async getResult(@Param('id') id: string) {
      const data = await this.guestService.getResult(id);
      
      return {
        success: true,
        message: 'Berhasil memuat hasil kuis.',
        uuid_req: randomUUID(),
        data,
      };
    }
  
  @Get()
  findAll() {
    return this.guestService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.guestService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGuestDto: UpdateGuestDto) {
    return this.guestService.update(+id, updateGuestDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.guestService.remove(+id);
  }
}
