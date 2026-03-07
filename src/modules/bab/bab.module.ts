import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BabService } from './bab.service';
import { BabController } from './bab.controller';
import { Bab, BabSchema } from './schemas/bab.schema';
import { MediaModule } from '../media/media.module';
import { UsersModule } from '../users/users.module';
import { QuestionModule } from '../question/question.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Bab.name, schema: BabSchema },
    ]),
    MediaModule,
    UsersModule,
    forwardRef(() => QuestionModule),
  ],
  controllers: [BabController],
  providers: [BabService],
  exports: [BabService, MongooseModule], 
})
export class BabModule {}