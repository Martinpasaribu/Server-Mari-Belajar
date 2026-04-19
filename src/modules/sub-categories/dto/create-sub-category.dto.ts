/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { ApiProperty } from '@nestjs/swagger';
import { 
  IsNotEmpty, 
  IsString, 
  IsNumber, 
  IsOptional, 
  IsMongoId, 
  IsBoolean, 
  IsArray,
  ValidateNested
} from 'class-validator';
import { MediaObjectDto } from '../../media/dto/create-media.dto';
import { Transform, Type } from 'class-transformer';
import { Types } from 'mongoose';


export class CreateSubCategoryDto {
  @ApiProperty({ example: '658a99988877766655544433', description: 'ID dari Category Induk' })
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (Types.ObjectId.isValid(value)) {
      return new Types.ObjectId(value);
    }
    return value; 
  })
  category_key! : Types.ObjectId;

  @ApiProperty({ example: 'Matematika Dasar CPNS' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'Materi persiapan tes intelegensia umum', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'Video, PDF, dan Latihan Soal', required: false })
  @IsString()
  @IsOptional()
  sub_description?: string;

  @ApiProperty({ example: 'sub Kategori untuk tes CPNS' })
  @IsString()
  @IsOptional()
  description_base?: string;

  @ApiProperty({ example: 'Terdiri dari TIU, TWK, TKP' })
  @IsString()
  @IsOptional()
  sub_description_base?: string;

  @ApiProperty({ example: 150000 })
  @IsNumber()
  @IsNotEmpty()
  price!: number;

  @ApiProperty({ example: 125000, required: false })
  @IsNumber()
  @IsOptional()
  discountPrice?: number;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isFree?: boolean;

  @ApiProperty({ example: 365, description: 'Durasi akses dalam hari', required: false })
  @IsNumber()
  @IsOptional()
  accessDurationDays?: number;

  @ApiProperty({ example: 0, required: false })
  @IsNumber()
  @IsOptional()
  order?: number;

  @ApiProperty({ type: MediaObjectDto, required: false })
  @IsOptional()
  @Type(() => MediaObjectDto)
  icon?: MediaObjectDto;

  @ApiProperty({ type: MediaObjectDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => MediaObjectDto)
  image_bg?: MediaObjectDto;

  @ApiProperty({ type: [MediaObjectDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaObjectDto)
  images?: MediaObjectDto[];

  @IsBoolean()
  @IsNotEmpty()
  isActive!: boolean;

}