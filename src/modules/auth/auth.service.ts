/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable max-len */
import { 
  Injectable, 
  UnauthorizedException, 
  BadRequestException 
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/create-auth.dto';
import { last } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  /**
   * 1. Logika Registrasi
   * Memanggil UsersService untuk hashing dan simpan data
   */
  async register(createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return this.generateToken(user);
  }

  /**
   * 2. Logika Login Manual (Local)
   * Memvalidasi email dan password
   */
  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    
    if (!user || !user.password) {
      throw new UnauthorizedException('Kredensial yang Anda masukkan salah');
    }

    const isPasswordMatching = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordMatching) {
      throw new UnauthorizedException('Kredensial yang Anda masukkan salah');
    }

    return this.generateToken(user);
  }

/**
   * 3. Logika Google Login (OAuth)
   */
  async googleLogin(googleUser: any) {
      if (!googleUser) {
        throw new BadRequestException('Data dari Google tidak ditemukan');
      }

      let user: any = await this.usersService.findByEmail(googleUser.email);

      if (!user) {
        // PERBAIKAN: Gunakan 'firstname' (huruf kecil semua) agar konsisten dengan schema & generateToken
        user = await this.usersService.create({
          email: googleUser.email,
          firstname: googleUser.firstName, // Ambil firstName saja dari Google
          lastname: googleUser.lastName,   // Ambil lastName saja dari Google
          avatar: googleUser.picture,
          provider: 'google',
          password: Math.random().toString(36).slice(-16),
          isActive: true,
        } as any);
      }

      return this.generateToken(user);
    }

  /**
   * 4. Helper: Generate JWT Token
   */
  private generateToken(user: any) {
    const payload = { 
      sub: user._id, 
      email: user.email,
      role: user.role 
    };

    return {
      access_token: this.jwtService.sign(payload),
      // PERBAIKAN: Pastikan memanggil properti yang benar-benar ada di objek user
      user: {
        id: user._id,
        email: user.email,
        firstname: user.firstname || user.firstName, // Fallback jika salah satu undefined
        lastname: user.lastname || user.lastName,
        account_type: user.account_type,
        role: user.role,
        avatar: user.avatar
      }
    };
  }


  // Di dalam class AuthService
  async getProfile(userId: string) {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('User tidak ditemukan');
    }

    // Kembalikan objek yang sama strukturnya dengan yang diharapkan Frontend
    return {
      id: user._id,
      email: user.email,
      firstname: user.firstname || user.firstname,
      lastname: user.lastname || user.lastname,
      avatar: user.avatar,
      role: user.role,
      account_type: user.account_type,
    };
  }
}