/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SubCategory } from '../sub-categories/schemas/sub-category.schema';
import { Model, Types } from 'mongoose';
import { Bab } from '../bab/schemas/bab.schema';
import { Category } from '../categories/schemas/category.schema';

@Injectable()
export class CatalogService {
  constructor(
    @InjectModel(SubCategory.name) private subCategoryModel: Model<SubCategory>,
    @InjectModel(Bab.name) private babModel: Model<Bab>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
  ) {}

  /**
   * Mengambil semua katalog (Sub-Category) yang aktif
   * Data ini akan ditampilkan di Dashboard untuk user pilih/beli
   */
  async getPublicCatalogs(query: any = {}): Promise<SubCategory[]> {
    return await this.subCategoryModel
      .find({ 
        isDeleted: false, 
        isActive: true, // Pastikan hanya modul yang sudah di-publish yang muncul
        ...query 
      })
      .populate('category_key', 'name description') // Ambil info kategori induk
      .select('name description image price order category_key, isFree') // Pilih field yang relevan saja
      .sort({ order: 1 }) 
      .exec();
  }

  /**
   * Mencari katalog berdasarkan ID (untuk halaman detail sebelum beli)
   */
  // Ubah return type-nya menjadi Promise<any> atau buat interface khusus
  async getCatalogById(id: string): Promise<{ catalog: any; bab: any[] }> {
      
      const catalog = await this.subCategoryModel
        .findOne({ _id: id, isDeleted: false })
        .populate('category_key', 'name')
        .exec();

      if (!catalog) {
        throw new NotFoundException('Katalog tidak ditemukan atau sudah tidak aktif');
      }

      const bab = await this.babModel
        .find({ 
          // Pastikan field ini benar, biasanya sub_category_key bukan category_key
          sub_category_key: new Types.ObjectId(id), 
          isDeleted: false 
        })
        .sort({ order: 1 })
        .exec();

      // Sekarang object ini valid karena sesuai dengan kembalian Promise di atas
      return {
        catalog,
        bab
      };
  }


  /**
   * Mencari daftar katalog (sub-categories) berdasarkan ID Category
   */
  async findListCatalogsByCategory(id: string) {
    // 1. Validasi ID dan cari Kategorinya terlebih dahulu
    const category = await this.categoryModel
      .findOne({ 
        _id: id, // Gunakan ID yang dikirim sebagai filter
        isDeleted: false 
      })
      .exec();

    if (!category) {
      throw new NotFoundException(`Kategori dengan ID ${id} tidak ditemukan`);
    }

    // 2. Cari semua sub-category (katalog) yang memiliki category_key tersebut
    const listCatalogs = await this.subCategoryModel
      .find({ 
        category_key: new Types.ObjectId(id), 
        isDeleted: false 
      })
      .populate('category_key', 'name') // Ambil nama kategori saja
      .sort({ order: 1 }) // Urutkan jika ada field order
      .lean()
      .exec();

    // 3. Return dengan struktur yang konsisten
    return {
      success: true,
      message: `Berhasil memuat ${listCatalogs.length} katalog untuk kategori ${category.name}`,
      data: listCatalogs
    };
  }

  /**
   * Pencarian katalog berdasarkan teks (Search Bar)
   */
  async searchCatalogs(term: string): Promise<SubCategory[]> {
    return await this.subCategoryModel
      .find({
        isDeleted: false,
        isActive: true,
        $or: [
          { name: { $regex: term, $options: 'i' } },
          { description: { $regex: term, $options: 'i' } }
        ]
      })
      .limit(10)
      .exec();
  }
}