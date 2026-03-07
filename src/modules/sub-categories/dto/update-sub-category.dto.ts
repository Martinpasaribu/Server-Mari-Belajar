import { PartialType } from '@nestjs/swagger';
import { CreateSubCategoryDto } from './create-sub-category.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateSubCategoryDto extends PartialType(CreateSubCategoryDto) {
  // Kita tambahkan isActive di sini karena biasanya update digunakan untuk nonaktifkan data
  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}