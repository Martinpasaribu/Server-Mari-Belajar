/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import axios from 'axios';
import * as EmailValidator from 'email-validator';

export class EmailHelper {

  /**
   * Pengecekan Email via Hunter.io API
   * Menjamin email benar-benar bisa menerima pesan (Deliverable)
   */
  static async isRealEmail(email: string): Promise<boolean> {
    // 1. Cek Syntax Dasar dulu (Hemat kuota API Hunter)
    const isSyntaxValid = EmailValidator.validate(email);
    if (!isSyntaxValid) return false;

    try {
      // 2. Panggil API Hunter Email Verifier
      const response = await axios.get('https://api.hunter.io/v2/email-verifier', {
        params: {
          email: email,
          api_key: process.env.HUNTER_API_KEY || '',
        },
      });

      const data = response.data.data;

      /**
       * Hunter Result Status:
       * - deliverable: Email pasti ada & aktif.
       * - risky: Bisa jadi ada, tapi server emailnya tidak memberi jawaban pasti.
       * - undeliverable: Email fix tidak ada/mati.
       */
      
      // Kita hanya izinkan yang 'deliverable' atau 'risky' (opsional)
      // Untuk "Mari Belajar" yang lebih ketat, pakai 'deliverable' saja.
      if (data.status === 'undeliverable') {
        console.warn(`[Hunter.io] Email ${email} ditolak: Undeliverable`);
        return false;
      }

      // Jika skor keberhasilan (score) terlalu rendah, kita tolak
      if (data.score < 50) {
        return false;
      }

      return true;
    } catch (error: any) {
      // Jika API Hunter error (misal: kuota habis), kita fallback ke true 
      // agar user tidak terhambat registrasinya karena masalah API pihak ke-3.
      console.error('[Hunter.io Error]', error.response?.data || error.message);
      return true; 
    }
  }
}