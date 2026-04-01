/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable max-len */

import { Injectable, ConflictException, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { MediaService } from '../media/media.service';
import { EmailHelper } from 'src/shared/utils/email-checker.util';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) 
    private userModel: Model<User>,
    private readonly mediaService: MediaService,
  ) {}


  /**
   * Registrasi User Baru (Local) dengan Pengecekan Email Real
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, firstname, lastname, ...rest } = createUserDto;

    // 1. Validasi DNS/MX Email (Pencegahan Email Palsu)
    const isReal = await EmailHelper.isRealEmail(email);
    if (!isReal) {
      throw new BadRequestException(
        'Email tidak valid atau penyedia layanan email tidak ditemukan. Gunakan email aktif.'
      );
    }

    // 2. Cek apakah email sudah terdaftar di database
    const existingUser = await this.userModel.findOne({ email }).exec();
    if (existingUser) {
      throw new ConflictException('Email sudah terdaftar, silakan gunakan email lain.');
    }

    try {
      // 3. Hash Password (dilakukan setelah validasi email selesai)
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // 4. Simpan User dengan data lengkap (termasuk goals & interested sebagai array)
      const newUser = new this.userModel({
        email,
        password: hashedPassword,
        firstname,
        lastname,
        provider: 'local',
        isActive: true, // Default aktif
        isEmailVerified: false, // Menunggu verifikasi link jika ada
        ...rest,
      });

      const savedUser = await newUser.save();
      
      // Kita hilangkan password dari return object demi keamanan
      const userObject = savedUser.toObject();
      delete userObject.password;
      
      return userObject as User;
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Gagal membuat akun, coba lagi nanti: ${error.message}`
      );
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

  async updatePassword(id: string, hashedPassword: string) {
    return this.userModel.findByIdAndUpdate(id, { password: hashedPassword });
  }


  async updateProfileData(userId: string, updateData: any) {
    const oldUser = await this.userModel.findById(userId).exec();
    if (!oldUser) throw new NotFoundException('User tidak ditemukan');

    // OTOMATIS: Jika ada data avatar baru, hapus yang lama dari ImageKit
    if (updateData.avatar) {
      await this.mediaService.handleMediaCleanup(oldUser.avatar, updateData.avatar);
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true },
      )
      .exec();

    if (!updatedUser) throw new NotFoundException('Gagal memperbarui profil');
    return updatedUser;
  }

/**
   * Logic Update Avatar (Handle File, Upload, & Cleanup)
   */
  async updateAvatar(userId: string, file: Express.Multer.File) {
    // 1. Cek User di awal (Cepat)
    const oldUser = await this.userModel.findById(userId).exec();
    if (!oldUser) {
      throw new NotFoundException('User tidak ditemukan, gagal memperbarui avatar');
    }

    let uploadResult: any = null;

    try {
      // 2. Upload ke ImageKit via MediaService
      // Jika ImageKit down atau file korup, error akan lari ke block catch
      uploadResult = await this.mediaService.uploadSingle(file);
      
      const newAvatar = {
        url: uploadResult.url,
        fileId: uploadResult.fileId
      };

      // 3. Jalankan Cleanup Media Lama (Hanya jika upload baru berhasil)
      // Kita bungkus cleanup dalam try-catch internal agar jika gagal hapus file lama,
      // update database tetap berjalan (karena update foto baru lebih penting)
      try {
        if (oldUser.avatar && oldUser.avatar.fileId) {
          await this.mediaService.handleMediaCleanup(oldUser.avatar, newAvatar);
        }
      } catch (error : any) {
        console.error('[Cleanup Error] Gagal menghapus file lama di ImageKit:', error.message);
        // Kita tidak throw error di sini agar proses utama tidak terhenti
      }

      // 4. Update database dengan data avatar baru
      const updatedUser = await this.userModel
        .findByIdAndUpdate(
          userId,
          { $set: { avatar: newAvatar } },
          { new: true }
        ).exec();

      if (!updatedUser) {
        throw new InternalServerErrorException('Gagal menyimpan data avatar ke database');
      }

      return updatedUser;

    } catch (error: any) {
      // 5. ROLLBACK LOGIC (Sangat Penting!)
      // Jika upload ke ImageKit sudah berhasil tapi database ERROR,
      // kita harus hapus lagi file yang baru saja diupload agar tidak jadi sampah.
      if (uploadResult && uploadResult.fileId) {
        await this.mediaService.deleteMedia(uploadResult.fileId).catch(() => {
            console.error('Gagal rollback file setelah error database');
        });
      }

      // 6. Lempar Error ke Controller agar Toast di FE jadi merah
      const errorMessage = error.response?.message || error.message || 'Gagal memproses upload avatar';
      throw new InternalServerErrorException(errorMessage);
    }
  }

}