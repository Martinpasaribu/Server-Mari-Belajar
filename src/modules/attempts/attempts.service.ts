/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable prefer-const */
/* eslint-disable operator-linebreak */
/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Attempt } from './schemas/attempt.schema';
import { Question } from '../question/schemas/question.schema';
import { Bab } from '../bab/schemas/bab.schema';

@Injectable()
export class AttemptsService {
  constructor(
    @InjectModel(Attempt.name) private attemptModel: Model<Attempt>,
    @InjectModel(Question.name) private questionModel: Model<Question>,
    @InjectModel(Bab.name) private babModel: Model<Bab>,
  ) {}

  async startAttempt(userId: string, babId: string) {
    const bab = await this.babModel.findById(babId).lean();
    if (!bab) throw new NotFoundException('Bab tidak ditemukan');
    
    const babDurationSeconds = (bab.duration || 30) * 60;

    let attempt = await this.attemptModel.findOne({
      user_key: new Types.ObjectId(userId),
      bab_key: new Types.ObjectId(babId),
      status: 'in_progress'
    }).sort({ createdAt: -1 }).exec();

    const now = new Date();

    if (attempt) {
      const startedAt = new Date(attempt['createdAt']); 
      const elapsedSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
      const remainingTime = babDurationSeconds - elapsedSeconds;

      return {
        ...attempt.toObject(),
        remainingTime: remainingTime > 0 ? remainingTime : 0,
        isResumed: true
      };
    }

    const newAttempt = new this.attemptModel({
      user_key: new Types.ObjectId(userId),
      bab_key: new Types.ObjectId(babId),
      status: 'in_progress',
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
    
    if (attempt.user_key.toString() !== userId) {
      throw new BadRequestException('Anda tidak berwenang mensubmit kuis ini');
    }

    if (attempt.status === 'submitted') throw new BadRequestException('Kuis ini sudah dikirim sebelumnya');

    // 1. Ambil SEMUA soal di bab ini (Handle soal yang tidak dijawab)
    const allQuestions = await this.questionModel.find({ 
      bab_key: attempt.bab_key 
    }).lean();

    if (!allQuestions.length) throw new BadRequestException(`Bab ini tidak memiliki soal :${attempt.bab_key}');`);

    let correctCount = 0;
    
    // 2. Bandingkan soal asli dengan jawaban user (jika ada)
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

    // 3. Hitung Skor & Lama Pengerjaan
    const totalQuestions = allQuestions.length;
    const score = (correctCount / totalQuestions) * 100;

    const now = new Date();
    const startedAt = new Date(attempt['createdAt']);
    const timeTakenSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);

    // 4. Update dan Simpan ke Database
    attempt.answers = processedAnswers as any;
    attempt.correct_count = correctCount;
    attempt.wrong_count = totalQuestions - correctCount;
    attempt.total_score = Math.round(score);
    attempt.status = 'submitted';
    attempt.submitted_at = now;
    
    // MENGISI FIELD DURATION_SECONDS
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
        select: 'question_text options correct_answer discussion_text'
      })
      .exec();

    if (!result) throw new NotFoundException('Hasil tidak ditemukan');
    return result;
  }

  //  ✅ Ambil Semua Hasil Ujian 

  async getResultByUser(userId: string) {
    // 1. Cast string userId ke ObjectId untuk keamanan pencarian

    const result = await this.attemptModel.find({ user_key: new Types.ObjectId(userId) })
        .populate('bab_key', 'name description duration') // Pastikan field 'name' ada di schema Bab, bukan 'title'
        // .populate({
        //   path: 'answers.question_key',
        //   select: 'question_text options correct_answer discussion_text'
        // })
        .sort({ createdAt: -1 }) // Ambil yang paling baru dikerjakan
        .exec();

      if (!result || result.length === 0) {
        throw new NotFoundException(`Hasil tidak ditemukan untuk User ID: ${userId}`);
      }

    return result;
  }

  /**
   * ✅ Ambil Hasil Ujian Dari Tiap Bab 
   */
  async getResultByBab(babId: string) {
    // 1. Validasi format ID untuk mencegah error internal server
    if (!Types.ObjectId.isValid(babId)) {
      throw new BadRequestException('Format ID Bab tidak valid');
    }

    const babObjectId = new Types.ObjectId(babId);

    // 2. Jalankan query secara paralel untuk performa lebih cepat
    const [results, bab] = await Promise.all([
      this.attemptModel.find({ bab_key: babObjectId })
        .populate('bab_key', 'name description duration')
        .populate({ 
          path: 'answers.question_key',
          select: 'question_text options correct_answer discussion_text'
        })
        .sort({ createdAt: -1 }) // Terbaru di atas
        .lean() // Gunakan lean agar lebih ringan (Plain JS Object)
        .exec(),
      
      this.babModel.findById(babObjectId).lean().exec()
    ]);

    // 3. Validasi keberadaan data
    if (!bab) {
      throw new NotFoundException(`Bab dengan ID ${babId} tidak ditemukan`);
    }

    // Tetap return data meskipun results kosong [], 
    // agar Frontend bisa menampilkan "Belum ada riwayat ujian" daripada error 404
    return {
      results,
      bab
    };
  }



}