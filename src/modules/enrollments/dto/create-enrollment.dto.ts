/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */


import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsMongoId, IsOptional, IsNumber, IsEnum, IsDateString, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Types } from 'mongoose';


export class CreateEnrollmentDto {
  @ApiProperty({ example: '658a999...' })
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (Types.ObjectId.isValid(value)) {
      return new Types.ObjectId(value);
    }
    return value; 
  })
  user_key!: Types.ObjectId;

  @ApiProperty({ example: '658a888...' })
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (Types.ObjectId.isValid(value)) {
      return new Types.ObjectId(value);
    }
    return value; 
  })
  sub_category_key!: Types.ObjectId;

  @ApiProperty({ enum: ['pending', 'success', 'expired', 'cancelled'] })
  @IsEnum(['pending', 'success', 'expired', 'cancelled'])
  @IsOptional()
  status?: string;

  @ApiProperty({ enum: ['free', 'purchased', 'gift'] })
  @IsEnum(['free', 'purchased', 'gift'])
  @IsOptional()
  enrollment_type?: string;

  @IsNumber()
  @IsOptional()
  amountPaid?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
  
  @IsBoolean()
  @IsOptional()
  settled?: boolean;

  @IsDateString()
  @IsOptional()
  expiredAt?: string;
}