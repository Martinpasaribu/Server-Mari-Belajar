/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
// src/configs/mailer.config.ts
import { MailerOptions } from '@nestjs-modules/mailer';
import { join } from 'path';
import * as ejs from 'ejs';
import * as fs from 'fs';

export const mailerConfig = (): MailerOptions => ({
  transport: {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  },
  defaults: {
    from: '"Mari Belajar" <noreply@maribelajar.com>',
  },
  template: {
    dir: join(process.cwd(), 'dist', 'templates'),
    /**
     * SOLUSI TERBAIK UNTUK NODE V22:
     * Kita membuat manual adapter sederhana. 
     * Ini akan luput dari error 'ERR_PACKAGE_PATH_NOT_EXPORTED' 
     * karena kita tidak memanggil sub-path library yang bermasalah.
     */
    adapter: {
      compile: (mail: any, callback: any, mailerOptions: any) => {
        const templatePath = join(mailerOptions.template.dir, mail.data.template + '.ejs');
        
        try {
          const template = fs.readFileSync(templatePath, 'utf-8');
          const rendered = ejs.render(template, mail.data.context);
          mail.data.html = rendered;
          return callback();
        } catch (err) {
          return callback(err);
        }
      },
    },
    options: {
      strict: true,
    },
  },
});