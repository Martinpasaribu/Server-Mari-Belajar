/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuestionsController } from './question.controller';
import { QuestionsService } from './question.service';
import { Question, QuestionSchema } from './schemas/question.schema';
import { UsersModule } from '../users/users.module';
import { BabModule } from '../bab/bab.module';
import { Bab, BabSchema } from '../bab/schemas/bab.schema';

@Module({
  imports: [
    // Tambahkan baris ini untuk mendaftarkan Model ke dalam Module
    MongooseModule.forFeature([
      { name: Question.name, schema: QuestionSchema },
      { name: 'Bab', schema: BabSchema }
    ]),
    

    UsersModule,
    forwardRef(() => BabModule),
  ],
  controllers: [QuestionsController],
  providers: [QuestionsService],
  exports: [QuestionsService, MongooseModule] // Sebaiknya di-export agar bisa dipakai di modul Attempts
})
export class QuestionModule {}