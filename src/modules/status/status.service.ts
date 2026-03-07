import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Question } from '../question/schemas/question.schema';
import { User } from '../users/schemas/user.schema';

@Injectable()
export class StatusService {
  constructor(
    @InjectModel('Question') private questionModel: Model<Question>,
    @InjectModel('User') private userModel: Model<User>,
  ) {}

  async getPublicStats() {
    // Menjalankan count secara paralel agar lebih cepat
    const [totalQuestions, totalUsers] = await Promise.all([
      this.questionModel.countDocuments().exec(),
      this.userModel.countDocuments().exec(),
    ]);

    return {
      success: true,
      data: {
        totalQuestions,
        totalUsers,
        updateMateri: 'Setiap Hari', // Hardcoded info
      },
    };
  }
}