// src/modules/media/dto/upload-media.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class UploadMediaDto {
  @ApiProperty({ 
    type: 'array', 
    items: { type: 'string', format: 'binary' },
    description: 'Bisa kirim banyak file sekaligus dengan key yang sama atau berbeda' 
  })
  files: any[];
}