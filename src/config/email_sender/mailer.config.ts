// src/configs/mailer.config.ts
import { MailerOptions } from '@nestjs-modules/mailer';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
import { join } from 'path';

export const mailerConfig = (): MailerOptions => ({
  transport: {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true untuk port 465
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  },
  defaults: {
    from: '"Mari Belajar" <noreply@maribelajar.com>',
  },
  template: {
    dir: join(process.cwd(), 'dist', 'templates'), // Sesuaikan path folder templates
    adapter: new EjsAdapter(),
    options: {
      strict: true,
    },
  },
});