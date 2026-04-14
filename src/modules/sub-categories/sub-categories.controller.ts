/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { 
  Controller, Get, Post, Body, Param, Put, Delete, Query, 
  BadRequestException,
  Patch
} from '@nestjs/common';
import { SubCategoriesService } from './sub-categories.service';
import { CreateSubCategoryDto } from './dto/create-sub-category.dto';
import { UpdateSubCategoryDto } from './dto/update-sub-category.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Sub Categories')
@Controller('sub-categories')
export class SubCategoriesController {
  constructor(private readonly subCategoriesService: SubCategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Membuat sub-kategori baru' })
  create(@Body() createDto: CreateSubCategoryDto) {
    return this.subCategoriesService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Mendapatkan semua sub-kategori (Filter by category_key opsional)' })
   async findAll(@Query('category_key') category_key?: string) {
    const filter = category_key ? { category_key } : {};
    const sub_category = await this.subCategoriesService.findAll(filter);

    return {
      success: true,
      message: 'Berhasil mengambil daftar kategori',
      data: sub_category, // <--- Ini yang dibaca oleh Frontend
    };
  }

  // sub-categories.controller.ts

  @Get('category/:categoryId')
  async getByCategory(@Param('categoryId') categoryId: string) {
    const result = await this.subCategoriesService.findByCategory(categoryId);
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mendapatkan detail satu sub-kategori' })
  findOne(@Param('id') id: string) {
    return this.subCategoriesService.findOne(id);
  }
  
  @Patch(':id')
  @ApiOperation({ summary: 'Mengupdate data sub-kategori' })
  update(@Param('id') id: string, @Body() updateDto: UpdateSubCategoryDto) {
    
    if (!id) throw new BadRequestException('ID Sub kategori diperlukan');
            
    return this.subCategoriesService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Menghapus sub-kategori (Soft Delete)' })
  remove(@Param('id') id: string) {
    return this.subCategoriesService.remove(id);
  }
}