import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { 
  IsEmail, 
  IsNotEmpty, 
  IsString, 
  MinLength, 
  IsOptional, 
  IsNumber, 
  Min, 
  ValidateNested,
  IsArray
} from 'class-validator';
import { MediaObjectDto } from 'src/modules/media/dto/create-media.dto';

export class CreateUserDto {
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Password wajib diisi' })
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'Nama Depan wajib diisi' })
  firstname!: string;

  @IsString()
  @IsOptional()
  // @IsNotEmpty({ message: 'Nama Belakang wajib diisi' })
  lastname!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  age?: number;

  @IsOptional()
  @IsString()
  title?: string; // Student, Designer, job seekers, etcg

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  goals?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  interested?: string[];
  
  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ type: MediaObjectDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => MediaObjectDto)
  avatar?: MediaObjectDto;

  @IsOptional()
  location?: string;
  
  @IsOptional()
  avatar_google?: string;
}

