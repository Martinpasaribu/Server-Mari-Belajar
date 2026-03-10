/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// src/modules/categories/categories.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from './schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { MediaService } from '../media/media.service';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,

    private readonly mediaService: MediaService // Tambahkan ini
  ) {}

  // 1. Buat Kategori Baru
  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    try {
      // Logika slug sederhana: "CPNS Baru" -> "cpns-baru"
      const slug = createCategoryDto.name.toLowerCase().replace(/ /g, '-');
      
      const newCategory = new this.categoryModel({
        ...createCategoryDto,
        slug,
      });
      
      return await newCategory.save();
    } catch (error : any) {
      if (error.code === 11000) {
        throw new ConflictException('Nama kategori atau slug sudah ada');
      }
      throw error;
    }
  }

  // 2. Ambil Semua (Dengan hitungan sub-category otomatis)
  async findAll(): Promise<Category[]> {
    return await this.categoryModel
      .find({ isDeleted: false })
      .populate('subCategoryCount') // Memanggil virtual field yang kita buat di schema
      .sort({ order: 1 }) // Urutkan berdasarkan urutan manual
      .exec();
  }

    // 2. Ambil Semua (Dengan hitungan sub-category otomatis)
  async findOptionsCategory(): Promise<Category[]> {
    return await this.categoryModel
      .find({ isDeleted: false })
      .populate('subCategoryCount') // Memanggil virtual field yang kita buat di schema
      .select('_id name')
      .sort({ order: 1 }) // Urutkan berdasarkan urutan manual
      .lean()
      .exec()
  }

  // 3. Ambil Satu Berdasarkan ID
  async findOne(id: string): Promise<Category> {
    const category = await this.categoryModel
      .findById(id, { isDeleted: false })
      .populate('subCategoryCount')
      .exec();

    if (!category) {
      throw new NotFoundException(`Kategori dengan ID ${id} tidak ditemukan`);
    }
    return category;
  }


// async update(id: string, updateCategoryDto: any) {
//   // Bersihkan data dari ID agar tidak konflik dengan Mongoose
//   const { _id, id: temp, __v, ...cleanData } = updateCategoryDto;

//   const updated = await this.categoryModel
//     .findByIdAndUpdate(
//       id, 
//       { $set: cleanData }, 
//       { new: true, runValidators: true }
//     )
//     .exec();

//   if (!updated) {
//     throw new NotFoundException(`Kategori dengan ID ${id} tidak ditemukan`);
//   }
  

//   // WAJIB: Kembalikan objek dengan properti success
//   return {
//     success: true,
//     message: 'Kategori berhasil diperbarui',
//     data: updated
//   };
// }


async update(id: string, updateCategoryDto: any) {
  const oldCategory = await this.categoryModel.findById(id).exec();
  if (!oldCategory) throw new NotFoundException('Kategori tidak ditemukan');

  const { _id, id: temp, __v, ...cleanData } = updateCategoryDto;

  // Jalankan cleanup untuk masing-masing field
  // Tidak perlu di-await agar response API tidak terhambat proses hapus di storage
  this.mediaService.handleMediaCleanup(oldCategory.icon, cleanData.icon);
  this.mediaService.handleMediaCleanup(oldCategory.image_bg, cleanData.image_bg);
  this.mediaService.handleMediaCleanup(oldCategory.images, cleanData.images);

  const updated = await this.categoryModel
    .findByIdAndUpdate(id, { $set: cleanData }, { new: true })
    .exec();

  return {
    success: true,
    data: updated
  };
}

  // 5. Hapus Kategori
  // async remove(id: string) {
  //   const result = await this.categoryModel.findByIdAndDelete(id).exec();
  //   if (!result) {
  //     throw new NotFoundException(`Kategori dengan ID ${id} tidak ditemukan`);
  //   }
  //   return { message: 'Kategori berhasil dihapus' };
  // }


// src/modules/categories/categories.service.ts

async remove(id: string) {
  // 1. Cari data kategori sebelum di-update untuk mendapatkan referensi fileId
  const category = await this.categoryModel.findById(id).exec();
  
  if (!category) {
    throw new NotFoundException(`Kategori dengan ID ${id} tidak ditemukan`);
  }

  // 2. OPSI A: Hapus file dari ImageKit (Jika ingin storage langsung bersih)
  // Jika ingin file tetap ada (untuk fitur restore), baris di bawah ini bisa dikomentari
  await this.mediaService.removeMedia([
    category.icon,
    category.image_bg,
    ...(category.images || [])
  ]);

  // 3. Eksekusi Soft Delete di Database
  const result = await this.categoryModel.findByIdAndUpdate(
    id, 
    { 
      isDeleted: true,
      isActive: false // Opsional: nonaktifkan juga agar tidak tampil di aplikasi
    }, 
    { new: true }
  ).exec();
  
  return { 
    success: true,
    message: 'Kategori berhasil dipindahkan ke sampah (Soft Delete)',
    data: result 
  };
}


}