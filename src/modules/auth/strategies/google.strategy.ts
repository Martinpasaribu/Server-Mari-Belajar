/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/require-await */

import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.CALL_BACK_URL,
      scope: ['email', 'profile'],
      prompt: 'select_account',
      passReqToCallback: true, // <--- 1. WAJIB TAMBAHKAN INI
    });
  }

  async validate(
    req: any, // <--- 2. WAJIB DITAMBAHKAN SEBAGAI PARAMETER PERTAMA
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos } = profile;
    const user = {
      email: emails[0].value,
      firstName: name.givenName || 'firstName blank',
      lastName: name.familyName || 'blank',
      picture: photos[0]?.value || '',
      accessToken,
    };
    done(null, user);
  }
}