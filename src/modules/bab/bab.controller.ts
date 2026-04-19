/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Controller, Get, Post, Body, Param, Put, Delete, Query, Patch, BadRequestException, UseGuards } from '@nestjs/common';
import { BabService } from './bab.service';
import { CreateBabDto } from './dto/create-bab.dto';
import { UpdateBabDto } from './dto/update-bab.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { AuthGuard } from '@nestjs/passport';
import { AccessGuard } from '../../common/guards/access.guard';

@ApiTags('Bab (Materi)')
@Controller('bab')
export class BabController {
  constructor(private readonly babService: BabService) {}

  @Post()
  @ApiOperation({ summary: 'Buat Bab materi baru' })
  create(@Body() createDto: CreateBabDto) {
    return this.babService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Ambil semua Bab (Bisa filter berdasarkan subCategoryId)' })
  findAll(@Query('sub_category_key') sub_category_key?: string) {
    return this.babService.findAll(sub_category_key);
    
  }

  @Get(':id/sub_category')
  @ApiOperation({ summary: 'Ambil semua Bab (Bisa filter berdasarkan subCategoryId)' })
  async getBySubCategory(@Param('id') subCategoryId: string) {
    const result = await this.babService.findBySubCategory(subCategoryId);
    return {
      success: true,
      message: 'Daftar Bab berhasil diambil',
      data: result,
    };
  }


  // Mengambil Pertanyaan kuis ( Sudah Login )
  @Get('questions/:id')
  @UseGuards(AuthGuard('jwt'), AccessGuard)
  async getBabQuestions(@Param('id') id: string) {
    const questions = await this.babService.findQuestionsByBab(id);
    
    return {
      success: true,
      message: 'Berhasil mengambil daftar soal',
      data: questions, // <--- Ini yang dibaca oleh Frontend
    };
  }

  // Mengambil Pertanyaan kuis ( Belum Login )
  @Get('questions/guest/:id')
  // @UseGuards(AuthGuard('jwt'), AccessGuard)
  async getBabQuestionsGuest(@Param('id') id: string) {
    const questions = await this.babService.findQuestionsByBabGuest(id);
    
    return {
      success: true,
      message: 'Berhasil mengambil daftar soal',
      data: questions, // <--- Ini yang dibaca oleh Frontend
    };
  }

  @Get('questions/admin/:id')
  async getBabQuestionsAtAdmin(@Param('id') id: string) {
    const questions = await this.babService.findQuestionsByBabAdmin(id);
    
    return {
      success: true,
      message: 'Berhasil mengambil daftar soal pada admin',
      data: questions, // <--- Ini yang dibaca oleh Frontend
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail satu Bab' })
  findOne(@Param('id') id: string) {
    return this.babService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update data Bab' })
  update(@Param('id') id: string,  @Body() updateDto: UpdateBabDto) {
        
    if (!id) throw new BadRequestException('ID Bab diperlukan');
        
    return this.babService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hapus Bab (Soft Delete)' })
  remove(@Param('id') id: string) {
    return this.babService.remove(id);
  }
}