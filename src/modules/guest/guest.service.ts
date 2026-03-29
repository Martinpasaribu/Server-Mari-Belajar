/* eslint-disable operator-linebreak */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateGuestDto } from './dto/create-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Question } from '../question/schemas/question.schema';
import { Bab } from '../bab/schemas/bab.schema'
import { Attempt } from '../attempts/schemas/attempt.schema';

@Injectable()
export class GuestService {

  constructor(
    @InjectModel(Attempt.name) private attemptModel: Model<Attempt>,
    @InjectModel(Question.name) private questionModel: Model<Question>,
    @InjectModel(Bab.name) private babModel: Model<Bab>,
  ) {}


  async startAttempt(userId: string, babId: string) {

    const bab = await this.babModel.findById(babId).lean();

    if (!bab) throw new NotFoundException('Bab tidak ditemukan');

    if (bab.question_keys.length <= 0) throw new NotFoundException(
      {
        message: 'Belum Ada Soal Tersedai saat ini',
        status: false,
        data: []
      }
    );
    
    const isGuest = userId === 'GUEST';
    const userKey = isGuest ? null : new Types.ObjectId(userId);

    if (isGuest && !(bab as any).isFree) {
      throw new BadRequestException('Silahkan login untuk mengakses bab ini');
    }

    const babDurationSeconds = (bab.duration || 30) * 60;

    if (!isGuest) {
      // 1. CEK: Apakah ada attempt di BAB YANG SAMA? (Resume logic)
      let currentAttempt = await this.attemptModel.findOne({
        user_key: userKey,
        bab_key: new Types.ObjectId(babId),
        status: 'in_progress'
      }).sort({ createdAt: -1 }).exec();

      if (currentAttempt) {
        const now = new Date();
        const startedAt = new Date(currentAttempt['createdAt']); 
        const elapsedSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
        const remainingTime = babDurationSeconds - elapsedSeconds;

        if (remainingTime <= 0) {
          currentAttempt.status = 'finished';
          await currentAttempt.save();
          return { ...currentAttempt.toObject(), remainingTime: 0, isResumed: true };
        }

        return {
          ...currentAttempt.toObject(),
          remainingTime,
          isResumed: true
        };
      }

      // 2. CEK: Apakah ada kuis di BAB LAIN yang masih 'in_progress'?
      // Jika ada, lempar error agar FE memunculkan modal warning
      const otherActiveAttempt = await this.attemptModel.findOne({
        user_key: userKey,
        status: 'in_progress',
        bab_key: { $ne: new Types.ObjectId(babId) } // cari yang bab_id nya BUKAN yang sekarang diklik
      }).exec();

      if (otherActiveAttempt) {
        throw new BadRequestException({
          statusCode: 400,
          message: 'Ada sesi kuis lain yang sedang berjalan',
          activeBabId: otherActiveAttempt.bab_key.toString() // ID ini yang dibaca Frontend untuk redirect
        });
      }
    }

    // 3. Jika tidak ada yang nyangkut, buat attempt baru
    const newAttempt = new this.attemptModel({
      user_key: userKey,
      bab_key: new Types.ObjectId(babId),
      status: 'in_progress',
      is_guest: isGuest
    });
    
    const savedAttempt = await newAttempt.save();
    return {
      ...savedAttempt.toObject(),
      remainingTime: babDurationSeconds,
      isResumed: false
    };
  }
  
  async submitAttempt(attemptId: string, userId: string, userAnswersDto: any[]) {
    const attempt = await this.attemptModel.findById(attemptId);
    if (!attempt) throw new NotFoundException('Attempt tidak ditemukan');
    
    // 1. VALIDASI KEPEMILIKAN (Sudah menangani Guest vs User)
    const isGuestSession = userId === 'GUEST';
    const hasOwner = !!attempt.user_key;

    if (!isGuestSession) {
      // Jika User Login, wajib punya owner dan ID harus match
      if (!hasOwner || attempt.user_key.toString() !== userId) {
        throw new BadRequestException('Akses ditolak: Kuis ini bukan milik Anda');
      }
    } else {
      // Jika Guest, data di DB tidak boleh ada owner-nya (harus null)
      if (hasOwner) {
        throw new BadRequestException('Akses ditolak: Kuis ini memerlukan login');
      }
    }

    // --- HAPUS BARIS LAMA YANG crash DI SINI ---
    // Jangan ada lagi attempt.user_key.toString() di luar proteksi di atas!

    if (attempt.status === 'submitted') {
      throw new BadRequestException('Kuis ini sudah dikirim sebelumnya');
    }

    // 2. Ambil SEMUA soal (Gunakan .lean() agar lebih cepat)
    const allQuestions = await this.questionModel.find({ 
      bab_key: attempt.bab_key,
      isDeleted: false
    }).lean();

    if (!allQuestions.length) {
      throw new BadRequestException(`Bab ini tidak memiliki soal: ${attempt.bab_key}`);
    }

    let correctCount = 0;
    
    // 3. Kalkulasi Jawaban
    const processedAnswers = allQuestions.map(originalQuestion => {
      const userAns = userAnswersDto.find(
        a => a.question_key.toString() === originalQuestion._id.toString()
      );

      const answerGiven = userAns ? userAns.answer_given : ""; 
      
      const isCorrect = answerGiven 
        ? String(originalQuestion.correct_answer).trim().toLowerCase() === String(answerGiven).trim().toLowerCase()
        : false;

      if (isCorrect) correctCount++;

      return {
        question_key: originalQuestion._id,
        answer_given: answerGiven,
        is_correct: isCorrect
      };
    });

    // 4. Hitung Skor & Waktu
    const totalQuestions = allQuestions.length;
    const score = (correctCount / totalQuestions) * 100;

    const now = new Date();
    const startedAt = new Date(attempt['createdAt']);
    const timeTakenSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);

    // 5. Update Dokumen
    attempt.answers = processedAnswers as any;
    attempt.correct_count = correctCount;
    attempt.wrong_count = totalQuestions - correctCount;
    attempt.total_score = Math.round(score);
    attempt.status = 'submitted';
    attempt.submitted_at = now;
    (attempt as any).duration_seconds = timeTakenSeconds; 
    
    const savedResult = await attempt.save();
    
    return {
      ...savedResult.toObject(),
      time_taken_seconds: timeTakenSeconds
    };
  }

  async getResult(attemptId: string) {
    const result = await this.attemptModel.findById(attemptId)
      .populate('bab_key', 'name description duration')
      .populate({
        path: 'answers.question_key',
        match: { isDeleted: false }, // Filter di level populasi
        select: 'question_text options correct_answer discussion_text question_audio question_images'
      })
      .exec();

    if (!result) throw new NotFoundException('Hasil tidak ditemukan');

    // Konversi ke object biasa
    const resultObj = result.toObject();

    // FILTER: Hapus answer yang question_key-nya null (karena isDeleted: true)
    resultObj.answers = resultObj.answers.filter(
      (ans) => ans.question_key !== null
    );

    return resultObj;
  }

  create(createGuestDto: CreateGuestDto) {
    return 'This action adds a new guest';
  }

  findAll() {
    return `This action returns all guest`;
  }

  findOne(id: number) {
    return `This action returns a #${id} guest`;
  }

  update(id: number, updateGuestDto: UpdateGuestDto) {
    return `This action updates a #${id} guest`;
  }

  remove(id: number) {
    return `This action removes a #${id} guest`;
  }
}
