import { Injectable, InternalServerErrorException } from '@nestjs/common';
import ImageKit from 'imagekit';
import { UploadResponse } from 'imagekit/dist/libs/interfaces';

@Injectable()
export class ImageKitService {
  private imagekit: ImageKit;

  constructor() {
    // Inisialisasi ImageKit dengan kredensial dari .env
    this.imagekit = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
    });
  }

  /**
   * Mengunggah file ke ImageKit
   * Return type menggunakan 'UploadResponse' agar properti url & fileId terbaca otomatis
   */
  async uploadImage(file: Express.Multer.File): Promise<UploadResponse> {
    try {
      const response = await this.imagekit.upload({
        file: file.buffer,
        fileName: `${Date.now()}-${file.originalname}`, // Nama unik agar tidak tertimpa
        folder: '/quiz-app-assets',
        useUniqueFileName: true,
      });

      return response;
    } catch (error) {
      console.error('ImageKit Upload Error:', error);
      throw new InternalServerErrorException('Gagal mengunggah file ke cloud storage');
    }
  }

  /**
   * Menghapus file dari ImageKit
   */
  async deleteImage(fileId: string): Promise<boolean> {
    try {
      await this.imagekit.deleteFile(fileId);
      return true;
    } catch (error) {
      console.error('ImageKit Delete Error:', error);
      return false; 
    }
  }
}