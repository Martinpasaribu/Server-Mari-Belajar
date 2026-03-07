// src/modules/categories/dto/create-category.dto.ts
import { IsString, IsOptional, IsNumber, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MediaObjectDto } from '../../media/dto/create-media.dto';
import { Type } from 'class-transformer';

export class CreateCategoryDto {
  @ApiProperty({ example: 'CPNS' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'Kategori untuk tes CPNS' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'Terdiri dari TIU, TWK, TKP' })
  @IsString()
  @IsOptional()
  sub_description?: string;

  @ApiProperty({ type: MediaObjectDto, required: false })
  @IsOptional()
  @Type(() => MediaObjectDto)
  icon?: MediaObjectDto;

  @ApiProperty({ type: MediaObjectDto, required: false })
  @IsOptional()
  @Type(() => MediaObjectDto)
  image_bg?: MediaObjectDto;

  @ApiProperty({ type: [MediaObjectDto], required: false })
  @IsOptional()
  @IsArray()
  @Type(() => MediaObjectDto)
  images?: MediaObjectDto[];

  @IsNumber()
  @IsOptional()
  order?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}