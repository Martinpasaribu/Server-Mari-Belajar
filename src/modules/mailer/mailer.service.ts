/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { MailerService as NestMailer } from '@nestjs-modules/mailer';

@Injectable()
export class MailerService {
  // 1. Inisialisasi Logger di sini, bukan di dalam constructor params
  private readonly logger = new Logger(MailerService.name);

  constructor(
    // 2. Hanya masukkan dependencies yang di-inject oleh NestJS di sini
    private readonly mailerService: NestMailer,
  ) {}

  async sendResetPasswordEmail(email: string, name: string, token: string) {
    const resetLink = `https://maribelajar.com/auth/reset-password?token=${token}`;
    const logoUrl = 'https://your-public-link.com/logo.png'; 

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: '🔒 Instruksi Reset Password - Mari Belajar',
        template: 'forgot-password', // Cukup nama filenya saja (tanpa ./ atau ekstensi)
        context: {
          name,
          resetLink,
          logoUrl,
        },
      });
      this.logger.log(`✅ Email Reset Password terkirim ke: ${email}`);
    } catch (error: any) {
      this.logger.error(`❌ Gagal kirim email reset: ${error.message}`);
    }
  }

  async sendPaymentSuccessEmail(user: any, enrollment: any, amount: number, orderId: string) {
    try {
      const nameToDisplay = user.firstName || user.name || 'Pelanggan';
      // Gunakan Optional Chaining agar tidak crash jika object null
      const moduleToDisplay = enrollment?.sub_category_key?.name || 'Modul Belajar';
      const formattedAmount = Number(amount).toLocaleString('id-ID');
      const formattedDate = new Date().toLocaleDateString('id-ID', { 
        day: 'numeric', month: 'long', year: 'numeric' 
      });

      this.logger.log(`Proses kirim email: ${user.email} | Name: ${nameToDisplay}`);

      await this.mailerService.sendMail({
        to: user.email,
        subject: `Konfirmasi Pembayaran: ${moduleToDisplay}`,
        template: 'payment-success', // Langsung namanya saja
        context: {
          name: nameToDisplay,
          moduleName: moduleToDisplay,
          amount: formattedAmount,
          orderId: String(orderId),
          date: formattedDate,
        },
      });

      this.logger.log(`✅ Email Pembayaran Berhasil Terkirim ke: ${user.email}`);
    } catch (err: any) {
      this.logger.error(`❌ Gagal kirim email pembayaran: ${err.message}`);
    }
  }
}