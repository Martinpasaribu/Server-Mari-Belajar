import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GuestService } from './guest.service';
import { GuestController } from './guest.controller';
import { Attempt, AttemptSchema } from '../attempts/schemas/attempt.schema';
import { Question, QuestionSchema } from '../question/schemas/question.schema';
import { Bab, BabSchema } from '../bab/schemas/bab.schema';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
      MongooseModule.forFeature([
        { name: Attempt.name, schema: AttemptSchema },
        { name: Question.name, schema: QuestionSchema },
        { name: Bab.name, schema: BabSchema },
      ]),
      UsersModule
    ],
  controllers: [GuestController],
  providers: [GuestService],
  exports: [GuestService],
})
export class GuestModule {}
