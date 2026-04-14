/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Question } from './schemas/question.schema';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { Bab } from '../bab/schemas/bab.schema';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectModel(Question.name) private questionModel: Model<Question>,
    @InjectModel(Bab.name) private babModel: Model<Bab>,
  ) {}

  // async create(createDto: CreateQuestionDto): Promise<Question> {
  //   // Cek dulu bab-nya ada gak?
  //   const babExist = await this.babModel.exists({ _id: createDto.bab_key });
  //   if (!babExist) {
  //     throw new NotFoundException(`Bab tidak ditemukan`);
  //   }

  //   // Kalau ada, baru buat soal dan update array-nya
  //   const savedQuestion = await this.questionModel.create(createDto);
  //   await this.babModel.findByIdAndUpdate(createDto.bab_key, {
  //     $addToSet: { question_keys: savedQuestion._id }
  //   });

  //   return savedQuestion;
  // }


  async create(createDto: CreateQuestionDto): Promise<Question> {
    // 1. Ambil data Bab untuk mendapatkan namanya
    const bab = await this.babModel.findById(createDto.bab_key);
    if (!bab) {
      throw new NotFoundException(`Bab tidak ditemukan`);
    }

    // 2. Ambil 2 huruf pertama dari nama Bab dan jadikan Uppercase
    // Kita hapus spasi terlebih dahulu agar tidak mengambil spasi sebagai karakter
    const babNameClean = bab.name.replace(/\s+/g, '');
    const prefix = babNameClean.substring(0, 2).toUpperCase();

    // 3. Hitung jumlah SEMUA soal yang ada di database (bukan per bab)
    const totalQuestions = await this.questionModel.countDocuments();
    const sequence = (totalQuestions + 1).toString().padStart(3, '0');

    // 4. Gabungkan jadi format: Q-XX-000
    const generatedCode = `Q-${prefix}-${sequence}`;

    // 5. Masukkan ke dalam payload
    const payload = {
      ...createDto,
      code: generatedCode,
    };

    // 6. Simpan soal
    const savedQuestion = await this.questionModel.create(payload);

    // 7. Update array question_keys di Bab
    await this.babModel.findByIdAndUpdate(createDto.bab_key, {
      $addToSet: { question_keys: savedQuestion._id }
    });

    return savedQuestion;
  }

  // Digunakan saat User sedang mengerjakan soal (Kunci & Pembahasan disembunyikan)
  async findAllForUser(bab_key: string): Promise<Question[]> {
    return await this.questionModel
      .find({ bab_key, isDeleted: false, isActive: true })
      .select('-correct_answer -discussion_text -discussion_video') // Proteksi data
      .sort({ order: 1 })
      .exec();
  }

  // Digunakan untuk Admin atau User yang sudah selesai ujian (Review Mode)
  async findAllFull(bab_key: string): Promise<Question[]> {
    return await this.questionModel
      .find({ bab_key: bab_key, isDeleted: false })
      .sort({ order: 1 })
      .exec();
  }

  /**
   * Mengambil seluruh data soal dari semua bab
   * Biasanya digunakan untuk dashboard utama admin
   */
  async findAllAdmin(): Promise<Question[]> {
    return await this.questionModel
      .find({ isDeleted: false }) // Tanpa filter bab_key
      .sort({ createdAt: -1 })    // Urutkan dari yang terbaru dibuat
      .exec();
  }

  async findAllWithFilter(bab_id?: string): Promise<Question[]> {
    const query: any = { isDeleted: false };

    // Pastikan bab_id ADA isinya, bukan string kosong, bukan "null", bukan "undefined"
    if (bab_id && bab_id !== "" && bab_id !== "undefined") {
      query.bab_key = bab_id;
    }

    // Jika bab_id kosong, query hanya akan berisi { isDeleted: false } -> Ambil SEMUA soal
    return await this.questionModel
      .find(query)
      .populate('bab_key', 'name') 
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Question> {
    const question = await this.questionModel.findById(id);
    if (!question) throw new NotFoundException('Soal tidak ditemukan');
    return question;
  }

  async update(id: string, updateDto: UpdateQuestionDto): Promise<Question> {
    const updated = await this.questionModel.findByIdAndUpdate(
      id,
      { $set: updateDto },
      { new: true },
    );
    if (!updated) throw new NotFoundException('Soal tidak ditemukan');
    return updated;
  }

  async remove(id: string): Promise<any> {
    const result = await this.questionModel.findByIdAndUpdate(id, { isDeleted: true });
    if (!result) throw new NotFoundException('Soal tidak ditemukan');
    return { message: 'Soal berhasil dihapus' };
  }
}