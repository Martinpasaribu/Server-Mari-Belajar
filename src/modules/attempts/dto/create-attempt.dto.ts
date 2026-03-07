/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */


import { IsNotEmpty, IsMongoId, IsArray, IsString, IsOptional } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Types } from 'mongoose';


export class StartAttemptDto {
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (Types.ObjectId.isValid(value)) {
      return new Types.ObjectId(value);
    }
    return value; 
  })
  bab_key!: Types.ObjectId;
}

class AnswerItemDto {
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (Types.ObjectId.isValid(value)) {
      return new Types.ObjectId(value);
    }
    return value; 
  })
  question_key!: Types.ObjectId;

  @IsString()
  answer_given!: string;
}

export class SubmitAttemptDto {
  @IsArray()
  @IsNotEmpty()
  answers!: AnswerItemDto[];
}