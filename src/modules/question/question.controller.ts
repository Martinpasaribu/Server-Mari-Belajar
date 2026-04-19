import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { QuestionsService } from './question.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { AuthGuard } from '@nestjs/passport';
import { AccessGuard } from '../../common/guards/access.guard';

@ApiTags('Questions')
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  // @UseGuards(AuthGuard('jwt'))
  @Post('admin')
  @ApiOperation({ summary: 'Admin: Membuat soal baru' })
  async create(@Body() createDto: CreateQuestionDto) {
    const questions =  await this.questionsService.create(createDto);

      return {
        success: true,
        message: 'Berhasil membuat soal',
        uuid_req: randomUUID(), // Menghasilkan ID unik untuk setiap request
        data:questions
        }
    };

  // @Get('user')
  // @ApiOperation({ summary: 'User: Mengambil daftar soal (Kunci disembunyikan)' })
  // findAll(@Query('bab_key') bab_key: string) {
  //   return this.questionsService.findAllForUser(bab_key);
  // }

  @Get()
  @UseGuards(AuthGuard('jwt'), AccessGuard)
  @ApiOperation({ summary: 'User: Mengambil daftar soal (Kunci disembunyikan)' })
  findAll(@Query('bab_key') bab_key: string) {
    return this.questionsService.findAllFull(bab_key);
  }
  
  @Get('admin')
  @ApiOperation({ summary: 'Admin: Mengambil daftar soal (Kunci ditampilkan)' })
  findAllAdmin(@Query('bab_key') bab_key: string) {
    return this.questionsService.findAllFull(bab_key);
  }

  @Get('review')
  @ApiOperation({ summary: 'User/Admin: Melihat soal lengkap dengan pembahasan' })
  findAllReview(@Query('bab_key') bab_key: string) {
    // Nantinya di sini bisa ditambah Guard: Hanya user yang sudah submit yang bisa akses
    return this.questionsService.findAllFull(bab_key);
  }

  @Get('all')
  @ApiOperation({ summary: 'Admin: Mengambil SEMUA soal tanpa filter bab' })
  async getAllQuestions() {
    const data  =  await this.questionsService.findAllAdmin();

    return {
      success: true,
      message: 'Berhasil mengambil daftar pertanyaan ',
      uuid_req: randomUUID(), // Menghasilkan ID unik untuk setiap request
      data: {
        questions: data
      },
    };
  }

  @Get('admin')
  @ApiOperation({ summary: 'Admin: Mengambil SEMUA soal tanpa filter bab' })
  async getAllQuestionsWF(@Query('bab_id') bab_id?: string) {
    return this.questionsService.findAllWithFilter(bab_id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail satu soal' })
  findOne(@Param('id') id: string) {
    return this.questionsService.findOne(id);
  }


  @Get('single/:id')
  // @Public() // Gunakan decorator Public jika kamu punya AuthGuard global
  async getSingleQuestion(@Param('id') id: string) {
    const data = await this.questionsService.findOnePublic(id);
    return {
      success: true,
      message: 'Berhasil mengambil data soal',
      data,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Admin: Update data soal' })
  update(@Param('id') id: string, @Body() updateDto: UpdateQuestionDto) {
    return this.questionsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Admin: Hapus soal (Soft Delete)' })
  remove(@Param('id') id: string) {
    return this.questionsService.remove(id);
  }
}