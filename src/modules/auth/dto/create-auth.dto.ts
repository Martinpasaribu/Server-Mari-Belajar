/* eslint-disable @typescript-eslint/no-unused-vars */

import { 
  IsEmail, 
  IsNotEmpty, 
  IsString, 
  MinLength, 
  IsOptional, 
  IsNumber, 
  Min 
} from 'class-validator';

export class CreateAuthDto {}


export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class GoogleAuthDto {
  @IsString()
  @IsNotEmpty()
  token!: string; // ID Token dari Google
}

