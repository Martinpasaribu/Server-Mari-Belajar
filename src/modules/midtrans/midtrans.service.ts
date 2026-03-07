/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-require-imports */
// src/payments/midtrans.service.ts

import { Injectable, Logger } from '@nestjs/common';
const midtransClient = require('midtrans-client');

@Injectable()
export class MidtransService {
  private readonly logger = new Logger(MidtransService.name);
  private snap: any;

  constructor() {
    this.snap = new midtransClient.Snap({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
    });
  }

  async createSnapToken(enrollment: any, user: any) {
    const parameters = {
      transaction_details: {
        order_id: enrollment._id.toString(), // ID transaksi unik
        gross_amount: enrollment.amountPaid, // Total harga
      },
      item_details: [
        {
          id: enrollment.sub_category_key._id.toString(),
          price: enrollment.amountPaid,
          quantity: 1,
          name: enrollment.sub_category_key.name,
        },
      ],
      customer_details: {
        first_name: user.name,
        email: user.email,
      },
      // Halaman tujuan setelah user bayar/tutup popup
      callbacks: {
        finish: `${process.env.FRONTEND_URL}/dashboard`,
        error: `${process.env.FRONTEND_URL}/dashboard`,
      },
    };

    try {
      const transaction = await this.snap.createTransaction(parameters);
      return transaction.token; // Inilah Snap Token untuk frontend
    } catch (error : any) {
      this.logger.error('Midtrans Snap Error:', error.message);
      throw error;
    }
  }
}