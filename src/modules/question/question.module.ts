/* eslint-disable max-len */
import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuestionsController } from './question.controller';
import { QuestionsService } from './question.service';
import { Question, QuestionSchema } from './schemas/question.schema';
import { UsersModule } from '../users/users.module';
import { BabModule } from '../bab/bab.module';

@Module({
  imports: [
    // Tambahkan baris ini untuk mendaftarkan Model ke dalam Module
    MongooseModule.forFeature([{ name: Question.name, schema: QuestionSchema }]),
    UsersModule,
    forwardRef(() => BabModule),
  ],
  controllers: [QuestionsController],
  providers: [QuestionsService],
  exports: [QuestionsService, MongooseModule] // Sebaiknya di-export agar bisa dipakai di modul Attempts
})
export class QuestionModule {}