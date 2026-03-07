// src/modules/media/media.module.ts
import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { ImageKitService } from 'src/config/imagekit.service';


@Module({
  controllers: [MediaController],
  providers: [MediaService, ImageKitService], // Tambahkan ImageKitService di sini
  exports: [MediaService], // Agar bisa dipakai di Module Category atau Sub-Category
})
export class MediaModule {}