/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/require-await */

import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'MARI_BELAJAR_SUPER_SECRET_2026',
    });
  }

  async validate(payload: any) {
    // Payload ini adalah isi dari token yang didecode
    // Apa yang direturn di sini akan masuk ke req.user
    return { 
      userId: payload.sub, 
      email: payload.email, 
      role: payload.role 
    };
  }
}