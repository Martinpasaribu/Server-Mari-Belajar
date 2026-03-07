import { PartialType } from '@nestjs/swagger';
import { CreateBabDto } from './create-bab.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateBabDto extends PartialType(CreateBabDto) {
  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}