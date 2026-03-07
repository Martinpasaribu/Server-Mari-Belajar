/* eslint-disable @typescript-eslint/no-unused-vars */
// src/modules/media/media.controller.ts
import { 
  Controller, 
  Post, 
  UseInterceptors, 
  UploadedFile, 
  UploadedFiles, 
  BadRequestException 
} from '@nestjs/common';
import { FileInterceptor, AnyFilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags, ApiBody } from '@nestjs/swagger';
import { MediaService } from './media.service';

@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload-single')
  @ApiOperation({ summary: 'Upload satu file (untuk Icon atau Foto Profil)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadSingle(@UploadedFile() file: Express.Multer.File) {
    return this.mediaService.uploadSingle(file);
  }

  @Post('upload-multiple')
  @ApiOperation({ summary: 'Upload banyak file sekaligus (untuk Gallery atau Soal)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @UseInterceptors(AnyFilesInterceptor())
  async uploadMultiple(@UploadedFiles() files: Express.Multer.File[]) {
    return this.mediaService.uploadMultiple(files);
  }
}