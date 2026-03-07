/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SubCategory } from './schemas/sub-category.schema';
import { CreateSubCategoryDto } from './dto/create-sub-category.dto';
import { UpdateSubCategoryDto } from './dto/update-sub-category.dto';
import slugify from 'slugify';
import { MediaService } from '../media/media.service';

@Injectable()
export class SubCategoriesService {
  constructor(
    @InjectModel(SubCategory.name) private subCategoryModel: Model<SubCategory>,
    private readonly mediaService: MediaService 
  ) {}

  async create(createDto: CreateSubCategoryDto): Promise<SubCategory> {
    const slug = slugify(createDto.name, { lower: true });

    // Cek apakah slug sudah ada untuk menghindari duplikat
    const existing = await this.subCategoryModel.findOne({ slug });
    if (existing) throw new ConflictException('Nama sub-kategori sudah digunakan');

    const newData = new this.subCategoryModel({
      ...createDto,
      slug,
    });

    return await newData.save();
  }

  async findAll(query: any = {}): Promise<SubCategory[]> {
    // Hanya ambil yang belum dihapus (Soft Delete)
    return await this.subCategoryModel
      .find({ isDeleted: false, ...query })
      .populate('category_key', 'name') // Ambil nama kategori induknya saja
      .sort({ order: 1 }) // Urutkan berdasarkan field 'order'
      .exec();
  }

  async findOne(id: string): Promise<SubCategory> {
    const data = await this.subCategoryModel.findOne({ _id: id, isDeleted: false })
      .populate('category_key');

    if (!data) throw new NotFoundException('Sub-Category tidak ditemukan atau sudah dihapus');
    return data;
  }

// Ambil sub category dari category key

async findByCategory(categoryId: string): Promise<any> {
  // 1. Ambil data kategori induk untuk mendapatkan Nama & Deskripsi (untuk Hero Header FE)
  // Kita asumsikan ada model Category atau ambil dari field populate
  const subCategories = await this.subCategoryModel
    .find({ 
      category_key: new Types.ObjectId(categoryId), 
      isDeleted: false 
    })
    .populate('category_key') // Ambil data lengkap kategori
    .sort({ order: 1 })
    .exec();

  if (!subCategories || subCategories.length === 0) {
    // Jika tidak ada sub-kategori, coba ambil minimal info kategori induknya saja
    // Agar FE tetap bisa menampilkan Nama Kategori meskipun list sub-nya kosong
    return {
      name: "Kategori",
      description: "Belum ada deskripsi",
      sub_categories: []
    };
  }

  // 2. Format ulang data agar sesuai dengan state 'data' di FE
  // FE mengakses: data.name, data.description, dan data.sub_categories
  const parentCategory = subCategories[0].category_key as any;

  return {
    _id: parentCategory._id,
    name: parentCategory.name,
    description: parentCategory.description,
    sub_description: parentCategory.sub_description,
    // Kita bungkus array sub-kategori ke dalam properti sub_categories
    sub_categories: subCategories 
  };
}

// sub-category.service.ts

async update(id: string, updateDto: UpdateSubCategoryDto): Promise<SubCategory> {
  // 1. Cari data lama untuk referensi cleanup media
  const oldData = await this.subCategoryModel.findById(id).exec();
  if (!oldData) throw new NotFoundException('Sub-Category tidak ditemukan');

  // 2. Generate slug jika nama berubah
  if (updateDto.name) {
    (updateDto as any).slug = slugify(updateDto.name, { lower: true });
  }

  // 3. Destruktur untuk membersihkan field internal yang mungkin terkirim dari frontend
  const { _id, id: temp, __v, ...cleanData } = updateDto as any;

  // 4. Jalankan Media Cleanup (Membandingkan file lama vs file baru)
  try {
    // MediaService akan mengecek jika icon/bg berubah, maka file lama di storage dihapus
    this.mediaService.handleMediaCleanup(oldData.icon, cleanData.icon);
    this.mediaService.handleMediaCleanup(oldData.image_bg, cleanData.image_bg);
    this.mediaService.handleMediaCleanup(oldData.images, cleanData.images);
  } catch (error) {
    // Log error tanpa menghentikan proses update database
    console.error('SubCategory Media Cleanup Error:', error);
  }

  // 5. Eksekusi Update ke Database
  const updatedData = await this.subCategoryModel.findByIdAndUpdate(
    id,
    { $set: cleanData },
    { new: true, runValidators: true },
  ).exec();

    if (!updatedData) throw new NotFoundException('Sub-Category tidak ditemukan');
    return updatedData;

}

  // async softDelete(id: string): Promise<any> {
  //   const result = await this.subCategoryModel.findByIdAndUpdate(
  //     id,
  //     { isDeleted: true },
  //     { new: true },
  //   );
  //   if (!result) throw new NotFoundException('Sub-Category tidak ditemukan');
  //   return { message: 'Sub-Category berhasil dihapus' };
  // }

  // sub-category.service.ts

async remove(id: string) {
  // 1. Cari data sub-kategori sebelum dihapus untuk mendapatkan referensi file media
  const subCategory = await this.subCategoryModel.findById(id).exec();
  
  if (!subCategory) {
    throw new NotFoundException(`Sub-Kategori dengan ID ${id} tidak ditemukan`);
  }

  // 2. Bersihkan file dari Storage (ImageKit/S3)
  // Kumpulkan semua field media yang ada di model SubCategory
  const mediaToCleanup = [
    subCategory.icon,
    subCategory.image_bg,
    ...(subCategory.images || [])
  ];

  // Eksekusi penghapusan file fisik di storage agar tidak menumpuk
  try {
    await this.mediaService.removeMedia(mediaToCleanup);
  } catch (error) {
    // Log error jika storage gagal, tapi lanjutkan proses delete di database
    console.error('Gagal menghapus media saat menghapus Sub-Kategori:', error);
  }

  // 3. Eksekusi Soft Delete di Database
  // Kita set isDeleted jadi true dan isActive jadi false
  const result = await this.subCategoryModel.findByIdAndUpdate(
    id, 
    { 
      $set: {
        isDeleted: true,
        isActive: false 
      }
    }, 
    { new: true }
  ).exec();
  
  return { 
    success: true,
    message: 'Sub-Kategori berhasil dihapus dan media telah dibersihkan',
    data: result 
  };
}



}