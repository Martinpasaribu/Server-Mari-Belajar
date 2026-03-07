/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable max-len */

import { Injectable, ConflictException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  /**
   * Registrasi User Baru (Local)
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, firstName, lastName, ...rest } = createUserDto;

    // 1. Cek apakah email sudah terdaftar
    const existingUser = await this.userModel.findOne({ email }).exec();
    if (existingUser) {
      throw new ConflictException('Email sudah terdaftar, silakan gunakan email lain.');
    }

    try {
      // 2. Hash Password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // 3. Simpan User
      const newUser = new this.userModel({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        provider: 'local',
        ...rest,
      });

      return await newUser.save();
    } catch (error : any) {
      throw new InternalServerErrorException(`Gagal membuat akun, coba lagi nanti : ${error.message}`);
    }
  }

  /**
   * Ambil Semua User (Hanya yang tidak dihapus secara soft-delete)
   */
  async findAll() {
    return await this.userModel.find({ isDeleted: false }).exec();
  }

  /**
   * Cari User Berdasarkan ID
   */
  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('ID tidak valid');
    
    const user = await this.userModel.findOne({ _id: id, isDeleted: false }).exec();
    if (!user) throw new NotFoundException('User tidak ditemukan');
    
    return user;
  }

  /**
   * Cari User Berdasarkan Email (Penting untuk Auth)
   */
  async findByEmail(email: string) {
    // Kita tambahkan .select('+password') karena di schema kita set select: false
    return await this.userModel.findOne({ email, isDeleted: false }).select('+password').exec();
  }

  /**
   * Update Profil User
   */
  async update(id: string, updateUserDto: UpdateUserDto) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('ID tidak valid');

    const updatedUser = await this.userModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, { $set: updateUserDto }, { new: true })
      .exec();

    if (!updatedUser) throw new NotFoundException('User tidak ditemukan atau sudah dihapus');
    return updatedUser;
  }

  /**
   * Soft Delete User
   */
  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('ID tidak valid');

    const result = await this.userModel
      .findOneAndUpdate({ _id: id }, { isDeleted: true, isActive: false })
      .exec();

    if (!result) throw new NotFoundException('User tidak ditemukan');
    return { message: 'User berhasil dinonaktifkan' };
  }

  /**
   * Update Progress Belajar (Custom method untuk Mari Belajar)
   */
  async updateProgress(userId: string, babId: string) {
    return await this.userModel.findByIdAndUpdate(
      userId,
      {
        $push: { 
          learning_progress: { 
            bab_key: new Types.ObjectId(babId), 
            last_accessed: new Date() 
          } 
        }
      },
      { new: true }
    );
  }
}