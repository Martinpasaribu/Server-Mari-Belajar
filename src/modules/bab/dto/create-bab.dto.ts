/* eslint-disable max-len */
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
import { MediaObjectDto } from 'src/modules/media/dto/create-media.dto';
import { Transform, Type } from 'class-transformer';
import { Types } from 'mongoose';


export class CreateBabDto {
  @ApiProperty({ example: '658a99988877766655544433', description: 'ID dari Sub-Category' })
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (Types.ObjectId.isValid(value)) {
      return new Types.ObjectId(value);
    }
    return value; 
  })
  sub_category_key!: Types.ObjectId;

  @ApiProperty({ example: 'Aljabar Dasar Bagian 1' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ 
    example: [], 
    description: 'Array of Question IDs', 
    required: false,
    default: [] 
  })

  @IsArray()
  @IsOptional()
  @IsMongoId({ each: true }) // Memvalidasi setiap isi array adalah format MongoID
  @Transform(({ value }) => {
    if (!Array.isArray(value)) return value;
    return value.map((id: string) => {
      // Hanya konversi jika formatnya valid, jika tidak biarkan agar ditangkap validator
      return Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : id;
    });
  })
  question_keys: Types.ObjectId[] = []; 

  @ApiProperty({ example: 'Pendahuluan mengenai variabel x dan y', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'Materi ini wajib dikuasai sebelum lanjut', required: false })
  @IsString()
  @IsOptional()
  sub_description?: string;

  @ApiProperty({ example: '## Judul Materi \n Ini adalah isi materi dalam markdown...', required: false })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ example: false, description: 'Apakah bab ini bisa dibuka gratis sebagai trial?' })
  @IsBoolean()
  @IsOptional()
  isFree?: boolean;

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

  @ApiProperty({ example: 'https://youtube.com/watch?v=...', required: false })
  @IsOptional()
  @Type(() => MediaObjectDto)
  video_url?: MediaObjectDto;

  @ApiProperty({ type: MediaObjectDto, required: false })
  @IsOptional()
  @Type(() => MediaObjectDto)
  document?: MediaObjectDto;

  @ApiProperty({ example: 1, description: 'Urutan Bab' })
  @IsNumber()
  @IsOptional()
  order?: number;

  @ApiProperty({ example: 0, description: 'Duration' })
  @IsNumber()
  @IsNotEmpty()
  duration?: number;

  @IsBoolean()
  @IsNotEmpty()
  isActive!: boolean;
}