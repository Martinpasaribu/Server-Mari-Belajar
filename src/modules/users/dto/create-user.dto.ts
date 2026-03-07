import { 
  IsEmail, 
  IsNotEmpty, 
  IsString, 
  MinLength, 
  IsOptional, 
  IsNumber, 
  Min 
} from 'class-validator';

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
  firstName!: string;

  @IsString()
  @IsNotEmpty({ message: 'Nama Belakang wajib diisi' })
  lastName!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  age?: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;
}

