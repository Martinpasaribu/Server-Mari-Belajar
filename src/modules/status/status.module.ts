import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { QuestionModule } from '../question/question.module';
import { StatusService } from './status.service';
import { StatusController } from './status.controller';

@Module({

  imports: [
    UsersModule,
    QuestionModule
  ],
  controllers: [StatusController],

  providers: [StatusService],

})
export class StatusModule {}
