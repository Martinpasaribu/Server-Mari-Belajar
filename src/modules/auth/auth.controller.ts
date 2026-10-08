/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-unsafe-return */
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
  Res, 
  HttpCode,
  HttpStatus,
  Query,
  Next
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/create-auth.dto'; // Pastikan nama file sesuai
import { CreateUserDto } from '../users/dto/create-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { NextFunction, Response } from 'express';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { GoogleAuthGuard } from './google-auth.guard';

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
  @UseGuards(GoogleAuthGuard)
  async googleAuth(@Req() req, @Res() res: Response, @Next() next: NextFunction) {
    const platform = req.query.platform || 'web';
    const redirectUri = req.query.redirect_uri || '';

    const stateData = JSON.stringify({ platform, redirectUri });
    req.query.state = Buffer.from(stateData).toString('base64');

    // Gunakan 'new' sebelum AuthGuard('google')
    const GuardClass = AuthGuard('google');
    const guardInstance = new GuardClass();

    return guardInstance.canActivate(
      new ExecutionContextHost([req, res, next])
    );
  }
  /**
   * CALLBACK: Google OAuth
   * Setelah user login di Google, Google akan mengirim data ke sini
   */
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
    async googleAuthRedirect(@Req() req, @Res() res: Response) {
      const result = await this.authService.googleLogin(req.user);

      let platform = 'web';
      let customRedirectUri = '';

      // Menerima kembali state dari Google
      if (req.query.state) {
        try {
          const decodedState = JSON.parse(
            Buffer.from(req.query.state as string, 'base64').toString('utf-8')
          );
          platform = decodedState.platform;
          customRedirectUri = decodedState.redirectUri;
        } catch (e) {
          console.error('Gagal me-parse OAuth state:', e);
        }
      }

      // Tentukan URL Redirect
      let redirectTargetUrl = '';

      if (platform === 'mobile') {
        if (customRedirectUri) {
          redirectTargetUrl = `${customRedirectUri}?token=${result.access_token}`;
        } else {
          redirectTargetUrl = `${process.env.MOBILE_APP_SCHEME || 'maribelajar'}://auth/callback?token=${result.access_token}`;
        }
      } else {
        redirectTargetUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${result.access_token}`;
      }

      return res.redirect(redirectTargetUrl);
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


/**
   * Endpoint untuk meminta reset password
   * POST /auth/forgot-password
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK) // Mengembalikan status 200 alih-alih 201 (Created)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  /**
   * Endpoint untuk eksekusi ganti password baru
   * POST /auth/reset-password
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body('token') token: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.authService.resetPassword(token, newPassword);
  }

}