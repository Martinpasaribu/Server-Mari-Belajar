import { ApiProperty } from '@nestjs/swagger';

export class UploadImageDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  image_bg: any;

  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' } })
  images: any[];
}
