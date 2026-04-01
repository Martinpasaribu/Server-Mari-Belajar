/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-require-imports */
import { Module, Global } from '@nestjs/common';
import { MailerService } from './mailer.service';
import { MailerModule as NestMailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';

@Global()
@Module({
  imports: [
    NestMailerModule.forRootAsync({
      imports: [ConfigModule], // Import ConfigModule agar bisa pakai ConfigService
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            // Ambil dari ConfigService, ini lebih aman daripada process.env langsung
            user: config.get<string>('EMAIL_USER'),
            pass: config.get<string>('EMAIL_PASS'),
          },
        },
        defaults: {
          from: '"Mari Belajar" <noreply@maribelajar.com>',
        },
        template: {
          dir: join(process.cwd(), 'dist', 'templates'),
          // Gunakan manual adapter untuk menghindari error Node v22
          adapter: {
            compile: (mail: any, callback: any, mailerOptions: any) => {
              const ejs = require('ejs');
              const fs = require('fs');
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
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MailerService],
  exports: [MailerService],
})
export class MailerModule {}