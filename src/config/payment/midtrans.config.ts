/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// src/config/midtrans.config.ts
import { registerAs } from '@nestjs/config';
import midtransClient from 'midtrans-client';

export const midtransConfig = registerAs('midtrans', () => ({
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
}));

// Helper untuk inisialisasi Snap
export const getMidtransSnap = () => {
  return new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY,
  });
};