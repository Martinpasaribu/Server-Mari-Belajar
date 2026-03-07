/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  imports: [
    UsersModule,
    // Tambahkan defaultStrategy agar Passport tahu harus pakai apa jika tidak disebut
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'MARI_BELAJAR_SUPER_SECRET_2026',
      signOptions: { expiresIn: '1d' }, 
    }),
  ],
  providers: [
    AuthService, 
    LocalStrategy, 
    JwtStrategy, 
    GoogleStrategy
  ],
  controllers: [AuthController],
  // PENTING: Export PassportModule dan JwtModule agar modul lain bisa mengenali Guard
  exports: [AuthService, PassportModule, JwtModule], 
})
export class AuthModule {}