/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable max-len */
import { Injectable, NotFoundException, ConflictException, Inject, forwardRef, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Bab } from './schemas/bab.schema';
import { CreateBabDto } from './dto/create-bab.dto';
import { UpdateBabDto } from './dto/update-bab.dto';
import slugify from 'slugify';
import { MediaService } from '../media/media.service';
import { CodeSectionGenerator } from '../../common/utils/generator';

@Injectable()
export class BabService {
  constructor(
    @InjectModel(Bab.name) private babModel: Model<Bab>,
    private readonly mediaService: MediaService // Tambahkan ini
    
  ) {}

  async create(createDto: CreateBabDto): Promise<Bab> {
    // 1. Generate Slug dari nama
    const slug = slugify(createDto.name, { lower: true });

    const processedSections = CodeSectionGenerator(createDto.section || []);

    // 2. Cek duplikasi slug
    const existing = await this.babModel.findOne({ slug, sub_category_key: createDto.sub_category_key });
    if (existing) throw new ConflictException('Nama Bab sudah ada di sub-kategori ini');

    // 3. Simpan data
    const newBab = new this.babModel({
      ...createDto,
      slug,
      section: processedSections,
    });

    return await newBab.save();
  }

  // Soal Attampt DIambil ( Sudah Login )
  async findQuestionsByBab(id: string): Promise<any> {
    const bab = await this.babModel
      .findOne({ _id: id, isDeleted: false })
      .populate({
        path: 'question_keys',
        match: { isDeleted: false },
        // Hapus sort order agar tidak berat di query
      })
      .exec();

    if (!bab) throw new NotFoundException('Bab tidak ditemukan');

    // Ambil array soal
    const questions = bab.question_keys as any[];

    // Algoritma Fisher-Yates untuk mengacak array secara merata
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }

    return {
      questions: questions,
      duration: bab.duration || 30,
      bab
    };
  }

  async findQuestionsByBabAdmin(id: string): Promise<any> {
    const bab = await this.babModel
      .findOne({ _id: id, isDeleted: false })
      .populate({
        path: 'question_keys',
        match: { isDeleted: false },
        // Melakukan nested populate di sini
        populate: {
          path: 'bab_key', // Sesuaikan dengan nama field di Question schema kamu
          model: 'Bab',    // Opsional: sebutkan modelnya jika relasinya cross-collection
          select: 'name title' // Opsional: pilih field tertentu saja agar tidak berat
        }
      })
      .exec();

    return bab;
  }

  async findQuestionsByBabGuest(id: string): Promise<any> {
    // 1. Cari Bab tanpa memfilter isFree terlebih dahulu
    const bab = await this.babModel
      .findOne({ _id: id, isDeleted: false })
      .populate({
        path: 'question_keys',
        match: { isDeleted: false },
        options: { sort: { order: 1 } }
      })
      .exec();

    // 2. Cek apakah Bab memang benar-benar ada di DB
    if (!bab) {
      throw new NotFoundException('Bab tidak ditemukan. Silakan periksa kembali link Anda.');
    }

    // 3. Cek apakah Bab ini gratis untuk Guest
    // Jika bab.isFree === false, maka kita lempar Forbidden atau Unauthorized
    if (!bab.isFree) {
      throw new ForbiddenException(
        'Materi ini eksklusif untuk member. Silakan login atau beli paket untuk mengakses soal ini.'
      );
    }

        // Ambil array soal
    const questions = bab.question_keys as any[];

    // Algoritma Fisher-Yates untuk mengacak array secara merata
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }


    // 4. Jika lolos semua pengecekan, kembalikan data
    return {
      questions: questions,
      duration: bab.duration || 30,
      babName: bab.name // Tambahan informasi untuk UI
    };
  }
  
  async findAll(sub_category_key?: string): Promise<Bab[]> {
    const filter: any = { isDeleted: false };
    if (sub_category_key) filter.sub_category_key = sub_category_key;

    return await this.babModel
      .find(filter)
      .populate('sub_category_key', 'name')
      .sort({ order: 1 }) // Urutkan materi dari Bab 1, 2, dst
      .exec();
  }

  async findOne(id: string): Promise<Bab> {
    const bab = await this.babModel.findOne({ _id: id, isDeleted: false })
      .populate('sub_category_key', 'name'); // Lihat nama paketnya
    
    if (!bab) throw new NotFoundException('Bab tidak ditemukan');
    return bab;
  }



  //  ✅ Ambil Semua bab berdasarkan sub-category

  async findBySubCategory(subCategoryId: string): Promise<any> {
    // 1. Ambil detail Sub-Category untuk info Header di FE
    // Kita asumsikan Anda memiliki akses ke model SubCategory di sini
    // Jika tidak, Anda bisa menggunakan .populate pada query Bab (seperti cara di bawah)
    
    const babList = await this.babModel
      .find({ 
        sub_category_key: new Types.ObjectId(subCategoryId), 
        isDeleted: false,
        isActive: true 
      })
      .populate('sub_category_key') // Ambil data lengkap Sub-Category
      // .populate('question_keys')
      .sort({ order: 1 })
      .exec();

    if (!babList || babList.length === 0) {
      // Jika tidak ada bab, kita tetap butuh info SubCategory-nya
      // Opsional: Anda bisa memanggil model SubCategory secara terpisah di sini
      return {
        sub_category: null,
        bab: []
      };
    }

    // 2. Ambil data Sub-Category dari item pertama (karena semua Bab punya parent yang sama)
    const subCategoryInfo = babList[0].sub_category_key;

    // 3. Transformasi daftar Bab
    const transformedBabs = babList.map((bab) => {
      const babObj = bab.toObject();
      return {
        ...babObj,
        totalQuestions: bab.question_keys?.length || 0,
        estimatedTime: bab.duration || 15 
      };
    });

    // 4. Return dalam satu objek utuh sesuai kebutuhan FE
    return {
      sub_category: subCategoryInfo,
      bab: transformedBabs
    };
  }

async update(id: string, updateDto: UpdateBabDto): Promise<Bab> {
  // 1. Cari data lama terlebih dahulu untuk keperluan cleanup media
  const oldBab = await this.babModel.findById(id).exec();
  if (!oldBab) throw new NotFoundException('Bab tidak ditemukan');

  // 2. Generate slug jika nama berubah
  if (updateDto.name) {
    (updateDto as any).slug = slugify(updateDto.name, { lower: true });
  }



  // 3. Destruktur data untuk memisahkan field internal jika terbawa dari frontend
  const { _id, id: temp, __v, ...cleanData } = updateDto as any;

  // 4. Jalankan Media Cleanup secara asinkron (Background Task)
  // Kita tambahkan pembersihan untuk video_url dan document yang spesifik milik Bab
  try {
    this.mediaService.handleMediaCleanup(oldBab.icon, cleanData.icon);
    this.mediaService.handleMediaCleanup(oldBab.image_bg, cleanData.image_bg);
    this.mediaService.handleMediaCleanup(oldBab.images, cleanData.images);
    
    // Cleanup khusus Bab: Video dan Dokumen
    if (oldBab.video_url !== undefined) {
      this.mediaService.handleMediaCleanup(oldBab.video_url, cleanData.video_url);
    }
    if (oldBab.document !== undefined) {
      this.mediaService.handleMediaCleanup(oldBab.document, cleanData.document);
    }
  } catch (error) {
    // Kita gunakan try-catch agar error cleanup tidak menggagalkan update database utama
    console.error('Media cleanup error:', error);
  }

  const processedSections = CodeSectionGenerator(updateDto.section || []);


  // 5. Eksekusi Update ke Database
  const updatedBab = await this.babModel.findByIdAndUpdate(
    id,
    { $set: { ...cleanData, section: processedSections } },
    { new: true, runValidators: true }
  ).exec();

    if (!updatedBab) throw new NotFoundException('Bab tidak ditemukan');
    return updatedBab;


}

  // async softDelete(id: string): Promise<any> {
  //   const result = await this.babModel.findByIdAndUpdate(id, { isDeleted: true });
  //   if (!result) throw new NotFoundException('Bab tidak ditemukan');
  //   return { message: 'Bab berhasil dihapus' };
  // }


  // bab.service.ts

async remove(id: string) {
  // 1. Cari data Bab sebelum dihapus untuk mendapatkan referensi file media
  const bab = await this.babModel.findById(id).exec();
  
  if (!bab) {
    throw new NotFoundException(`Bab dengan ID ${id} tidak ditemukan`);
  }

  // 2. Bersihkan file dari Storage (ImageKit/S3)
  // Kita kumpulkan semua field media yang mungkin ada di model Bab
  const mediaToCleanup = [
    bab.icon,
    bab.image_bg,
    bab.video_url, // File video
    bab.document,  // File PDF/Dokumen
    ...(bab.images || []) // Array galeri pendukung
  ];

  // Kirim ke mediaService untuk proses penghapusan file fisik
  await this.mediaService.removeMedia(mediaToCleanup);

  // 3. Eksekusi Soft Delete di Database
  // Mengikuti pola Category: isDeleted true dan isActive false
  const result = await this.babModel.findByIdAndUpdate(
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
    message: 'Bab berhasil dihapus (Soft Delete) dan media telah dibersihkan',
    data: result 
  };
}

}