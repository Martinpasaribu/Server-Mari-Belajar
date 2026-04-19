/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { ApiProperty } from '@nestjs/swagger';
import { 
  IsNotEmpty, IsString, IsOptional, IsEnum, IsNumber, 
  IsArray, ValidateNested, IsMongoId, IsBoolean 
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { MediaObjectDto } from '../../media/dto/create-media.dto';
import { Types } from 'mongoose';

class OptionDto {
  @IsString()
  @IsNotEmpty()
  label!: string;

  @IsString()
  @IsOptional()
  text?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => MediaObjectDto)
  image?: MediaObjectDto;
}

class SectionDto {
  @IsOptional() // Tambahkan ini agar tidak komplain saat kosong
  @IsString()
  label?: string;

  @IsString()
  @IsOptional()
  name?: string;
}

export class CreateQuestionDto {
@ApiProperty({ example: '658a123abc...' })
  // @IsMongoId()
  // @IsNotEmpty()
  // @Transform(({ value }) => {
  //   if (!Types.ObjectId.isValid(value)) return value;
  //   return new Types.ObjectId(value);
  // })
  // bab_key!: Types.ObjectId; // Sekarang tipenya benar-benar ObjectId
  
  @ApiProperty({ example: '658a123abc...' })
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (Types.ObjectId.isValid(value)) {
      return new Types.ObjectId(value);
    }
    return value; 
  })
  
  bab_key!: Types.ObjectId;

  @ApiProperty({ enum: ['multiple_choice', 'essay', 'image_options'] })
  @IsEnum(['multiple_choice', 'essay', 'image_options'])
  @IsNotEmpty()
  type!: string;

  @IsString()
  @IsOptional() // Optional karena di-generate oleh sistem
  code?: string;

  @IsString()
  @IsNotEmpty()
  question_text!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SectionDto)
  section?: SectionDto | null;

  @IsString()
  @IsNotEmpty()
  question_text_base!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => MediaObjectDto)
  question_audio?: MediaObjectDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaObjectDto)
  question_images?: MediaObjectDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OptionDto)
  options?: OptionDto[];

  @IsString()
  @IsNotEmpty()
  correct_answer!: string;

  @IsBoolean()
  @IsNotEmpty()
  isActive!: boolean;

  @IsString()
  @IsNotEmpty()
  discussion_text!: string;

  @IsString()
  @IsNotEmpty()
  discussion_text_base!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => MediaObjectDto)
  discussion_video?: MediaObjectDto;

  @IsNumber()
  @IsOptional()
  order?: number;
}