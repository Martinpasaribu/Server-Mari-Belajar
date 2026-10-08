/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// src/auth/guards/google-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';


@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();

    // 1. Tangkap parameter dari query mobile/web
    const platform = req.query.platform || 'web';
    const redirectUri = req.query.redirect_uri || '';

    // 2. Bungkus ke format Base64
    const stateData = JSON.stringify({ platform, redirectUri });
    const encodedState = Buffer.from(stateData).toString('base64');

    // 3. Return opsi 'state' agar Passport membawanya ke Google
    return {
      state: encodedState,
    };
  }
}