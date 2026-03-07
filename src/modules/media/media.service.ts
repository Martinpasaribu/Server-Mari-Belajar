/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable function-paren-newline */
// src/modules/media/media.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { ImageKitService } from '../../config/imagekit.service';

// Kita definisikan interface agar TypeScript tidak bingung

@Injectable()
export class MediaService {
  constructor(private readonly imageKitService: ImageKitService) {}

  private getFileType(mimetype: string): string {
    if (mimetype.includes('image')) return 'image';
    if (mimetype.includes('audio')) return 'audio';
    if (mimetype.includes('video')) return 'video';
    if (mimetype.includes('pdf')) return 'pdf';
    return 'other';
  }

  async uploadSingle(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File tidak ditemukan');
    
    // Kita paksa (cast) tipe datanya menjadi ImageKitResponse atau any
    const result = await this.imageKitService.uploadImage(file) as any;
    
    return {
      url: result?.url || result, // Jika result cuma string, ambil result-nya
      fileId: result?.fileId || null,
      fileType: this.getFileType(file.mimetype),
    };
  }

  async uploadMultiple(files: Express.Multer.File[]) {
    if (!files || files.length === 0) return [];
    
    const uploadPromises = files.map(async (file) => {
      const result = await this.imageKitService.uploadImage(file) as any;
      
      return {
        url: result?.url || result,
        fileId: result?.fileId || null,
        fileType: this.getFileType(file.mimetype),
        fieldName: file.fieldname,
      };
    });
    
    return await Promise.all(uploadPromises);
  }

  async deleteMedia(fileId: string) {
    if (!fileId) return;
    return await this.imageKitService.deleteImage(fileId);
  }

  async deleteFile(fileId: string) {
      try {
        return await this.imageKitService.deleteImage(fileId);
      } catch (err : any) {
        console.error(`Gagal menghapus file: ${fileId}`, err.message);
      }
    }

  /**
   * Mengotomatisasi penghapusan file lama yang diganti atau dihapus
   * Mendukung single object { fileId, url } maupun Array of objects
   */
  async handleMediaCleanup(oldMedia: any, newMedia: any) {
    const filesToDelete: string[] = [];

    const extractFileIds = (data: any): string[] => {
      if (!data) return [];
      if (Array.isArray(data)) {
        return data.map((item) => item?.fileId).filter(Boolean);
      }
      return data?.fileId ? [data.fileId] : [];
    };

    const oldIds = extractFileIds(oldMedia);
    const newIds = extractFileIds(newMedia);

    // Ambil ID yang ada di lama tapi TIDAK ada di baru
    const idsToRemove = oldIds.filter((id) => !newIds.includes(id));
    
    if (idsToRemove.length > 0) {
      await Promise.all(idsToRemove.map((id) => this.deleteFile(id)));
      console.log(`[Media Cleanup] Berhasil menghapus ${idsToRemove.length} file.`);
    }
  }


  /**
   * Fungsi universal untuk menghapus media dari ImageKit.
   * Mendukung input berupa: 
   * - string (tunggal fileId)
   * - string[] (array of fileId)
   * - object (MediaObject yang punya properti fileId)
   */
  async removeMedia(payload: string | string[] | any | any[]) {
    if (!payload) return;

    const fileIds: string[] = [];

    // 1. Normalisasi input menjadi array fileId
    const items = Array.isArray(payload) ? payload : [payload];

    items.forEach((item) => {
      if (typeof item === 'string') {
        // Jika input berupa string ID langsung
        fileIds.push(item);
      } else if (item && typeof item === 'object' && item.fileId) {
        // Jika input berupa object Media { url, fileId, ... }
        fileIds.push(item.fileId);
      }
    });

    // 2. Eksekusi penghapusan secara paralel
    if (fileIds.length > 0) {
      const results = await Promise.all(
        fileIds.map((id) => this.imageKitService.deleteImage(id))
      );
      return results;
    }
    
    return [];
  }
  
}