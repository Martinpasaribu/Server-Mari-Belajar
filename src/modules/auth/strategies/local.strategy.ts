import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    // Beritahu Passport kita pakai 'email' sebagai pengganti 'username'
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<any> {
    // Fungsi login ini harus ada di AuthService kamu
    const user = await this.authService.login({ email, password });
    if (!user) {
      throw new UnauthorizedException('Email atau password salah');
    }
    return user; 
  }
}