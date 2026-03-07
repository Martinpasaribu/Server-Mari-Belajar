/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AttemptsService } from './attempts.service';
import { AttemptsController } from './attempts.controller';
import { Attempt, AttemptSchema } from './schemas/attempt.schema';
import { Question, QuestionSchema } from '../question/schemas/question.schema';
import { Bab, BabSchema } from '../bab/schemas/bab.schema';
import { UsersModule } from '../users/users.module';

// attempts.module.ts
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Attempt.name, schema: AttemptSchema },
      { name: Question.name, schema: QuestionSchema },
      { name: Bab.name, schema: BabSchema },
    ]),
    UsersModule
  ],
  controllers: [AttemptsController], // <--- CEK INI
  providers: [AttemptsService],
  exports: [AttemptsService],
})
export class AttemptsModule {}