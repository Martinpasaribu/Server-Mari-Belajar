/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// src/modules/delivery/delivery.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '../mailer/mailer.service';
// import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(private readonly mailerService: MailerService) {}

// src/modules/delivery/delivery.service.ts

// src/modules/delivery/delivery.service.ts

// async sendPaymentSuccessEmail(user: any, enrollment: any, amount: number, orderId: string) {
//   try {
//     // 1. Siapkan data dengan sangat hati-hati
//     const nameToDisplay = user.firstName || user.name || 'Pelanggan';
//     const moduleToDisplay = enrollment.sub_category_key?.name || 'Modul Belajar';
//     const formattedAmount = Number(amount).toLocaleString('id-ID');
//     const formattedDate = new Date().toLocaleDateString('id-ID', { 
//       day: 'numeric', month: 'long', year: 'numeric' 
//     });

//     this.logger.log(`Proses kirim email: ${user.email} | Name: ${nameToDisplay}`);

//     await this.mailerService.sendMail({
//       to: user.email,
//       subject: `Konfirmasi Pembayaran: ${moduleToDisplay}`,
//       template: 'payment-success', // hapus './' coba langsung namanya saja
//       context: {
//         // Kirim dua-duanya untuk jaga-jaga (beberapa versi butuh pembungkus)
//         name: nameToDisplay,
//         moduleName: moduleToDisplay,
//         amount: formattedAmount,
//         orderId: String(orderId),
//         date: formattedDate,
//         // Tambahkan locals sebagai cadangan
//         locals: {
//           name: nameToDisplay,
//           moduleName: moduleToDisplay,
//           amount: formattedAmount,
//           orderId: String(orderId),
//           date: formattedDate,
//         }
//       },
//     });

//     this.logger.log(`✅ Email Berhasil Terkirim ke: ${user.email}`);
//   } catch (err: any) {
//     this.logger.error(`❌ Gagal kirim email: ${err.message}`);
//   }
// }

}