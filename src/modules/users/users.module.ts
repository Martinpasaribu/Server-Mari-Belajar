import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema'; // Import Schema-mu
import { MediaModule } from '../media/media.module';

@Module({
  imports: [
    // 1. Daftarkan User Model di sini
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MediaModule
  ],
  controllers: [UsersController],
  providers: [UsersService],
  // 2. Export MongooseModule agar modul lain (Bab, Question, Enrollment) 
  // bisa pakai UserModel tanpa harus daftar ulang forFeature
  exports: [UsersService, MongooseModule], 
})
export class UsersModule {}