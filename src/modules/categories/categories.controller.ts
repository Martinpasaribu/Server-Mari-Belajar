/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable operator-linebreak */
/* eslint-disable max-len */
// src/modules/categories/categories.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFiles, Query, BadRequestException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ApiBody, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { AnyFilesInterceptor } from '@nestjs/platform-express';

@Controller('categories')
export class CategoriesController {

  constructor(
    private readonly categoriesService: CategoriesService,
  ) {}

  // Create Kategori
  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  // Ambil Semua (Hasilnya include subCategoryCount)
  @Get()
   async findAll() {
    const categories =  await this.categoriesService.findAll();

    return {
      success: true,
      message: 'Berhasil mengambil daftar kategori',
      data: categories, // <--- Ini yang dibaca oleh Frontend
    };

  }

  // Ambil Satu berdasarkan ID string MongoDB
  @Get(':id')
  findOne(@Param('id') id: string) {
    // Hapus tanda '+' karena MongoDB ID adalah string
    return this.categoriesService.findOne(id);
  }

// src/modules/categories/categories.controller.ts

  @Patch()
  async update(
    @Query('id') id: string, 
    @Body() updateCategoryDto: UpdateCategoryDto
  ) {
    // Pastikan ID ada sebelum lanjut
    if (!id) throw new BadRequestException('ID kategori diperlukan');
    
    return await this.categoriesService.update(id, updateCategoryDto);
  }

  // Hapus Data a
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }

  
}