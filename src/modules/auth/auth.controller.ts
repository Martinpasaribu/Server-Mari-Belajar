/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  UseGuards, 
  Req, 
  Res 
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/create-auth.dto'; // Pastikan nama file sesuai
import { CreateUserDto } from '../users/dto/create-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * PINTU 1: Registrasi Manual
   */
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  /**
   * PINTU 2: Login Manual (Local)
   * Menghasilkan JWT jika email & password benar
   */
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * PINTU 3: Google Login (Initiator)
   * Endpoint ini akan mengalihkan user ke halaman login Google
   */
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {
    // Passport akan menghandle redirect ke Google
  }

  /**
   * CALLBACK: Google OAuth
   * Setelah user login di Google, Google akan mengirim data ke sini
   */
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const result = await this.authService.googleLogin(req.user);
    
    // 2. Redirect ke halaman callback di Next.js sambil membawa token
    // Sesuaikan URL frontend kamu (localhost:3000)
    const frontendUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${result.access_token}`;
    
    return res.redirect(frontendUrl);
  }

  

  /**
   * PINTU 4: Get Profile (Solusi untuk Frontend)
   * Digunakan Frontend untuk mengambil data user lengkap berdasarkan Token
   */
  @UseGuards(AuthGuard('jwt')) // TAMBAHKAN 'jwt' DI SINI
  @Get('profile')
  async getProfile(@Req() req) {
    // Pastikan payload di JwtStrategy kamu menyimpan property 'userId' atau 'sub'
    // Jika di strategy kamu pakai 'sub', maka gunakan req.user.sub
    return this.authService.getProfile(req.user.userId || req.user.sub);
  }

}