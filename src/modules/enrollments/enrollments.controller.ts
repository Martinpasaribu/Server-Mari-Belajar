/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Patch, 
  UseGuards, 
  Req,
  ForbiddenException,
  NotFoundException,
  Logger,
  HttpCode,
  Res,
  StreamableFile
} from '@nestjs/common';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EnrollmentService } from './enrollments.service';
import { AttemptsService } from '../attempts/attempts.service';
import { MidtransService } from '../midtrans/midtrans.service';
import { Types } from 'mongoose';
import { Response } from 'express';

@ApiTags('Enrollments') // Untuk dokumentasi Swagger
@ApiBearerAuth()        // Menandakan endpoint ini butuh Token
@Controller('enrollments')
export class EnrollmentController {
  
  // 2. Deklarasikan logger di sini
  private readonly logger = new Logger(EnrollmentController.name);

  constructor(
    private readonly enrollmentService: EnrollmentService,
    private readonly attemptsService: AttemptsService,
    private readonly midtransService: MidtransService,
  ) {}


  /**
   * 1. Pendaftaran Paket (Checkout/Beli)
   * Menggunakan ID User dari Token agar lebih aman
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('buy')
  @ApiOperation({ summary: 'Mendaftarkan user ke sub-category (Beli/Enroll)' })
  async create(@Req() req, @Body() dto: CreateEnrollmentDto) {
    // Timpa user_key dari DTO dengan ID dari JWT untuk mencegah spoofing
    dto.user_key = req.user.userId; 
    return this.enrollmentService.createEnrollment(dto);
  }

  /**
   * 2. Ambil Semua Paket yang Dimiliki User Login
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('my-modules/all')
  @ApiOperation({ summary: 'Melihat semua modul yang sudah dibeli user' })
  async getMyModulesAll(@Req() req) {
    return this.enrollmentService.findByUser(req.user.userId);
  }

  /**
   * 2. Ambil Semua Paket yang Dimiliki User Login
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('my-modules')
  @ApiOperation({ summary: 'Melihat semua modul yang sudah dibeli user' })
  async getMyModules(@Req() req) {
    return this.enrollmentService.findByUserModules(req.user.userId);
  }

  /**
   * 3. Cek Status Akses Spesifik (Internal/Frontend check)
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('check/:subCategoryId')
  async checkAccess(@Req() req, @Param('subCategoryId') subCategoryId: string) {
    const hasAccess = await this.enrollmentService.hasAccess(req.user.userId, subCategoryId);
    return { hasAccess };
  }

  /**
   * 4. Update Status (Biasanya digunakan oleh Admin atau Webhook Payment)
   */
  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/admin/status')
  async updateStatus(
    @Param('id') id: string, 
    @Body('status') status: string,
    @Req() req
  ) {
    // Proteksi: Hanya Admin yang bisa ganti status manual
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Hanya admin yang bisa mengubah status transaksi');
    }
    return this.enrollmentService.updateStatus(id, status);
  }

  @Get(':id/status')
  async getEnrollmentStatus(@Param('id') id: string) {
    const data = await this.enrollmentService.checkStatus(id);
    
    return {
      success: true,
      message: 'Status enrollment berhasil dimuat',
      data: data,
    };
  }
  
  /**
   * 5. Grant Gift (Admin Only)
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('grant-gift')
  async grantAccess(@Req() req, @Body() body: { userId: string, subCategoryId: string }) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Akses ditolak');
    }
    return this.enrollmentService.grantGiftAccess(body.userId, body.subCategoryId);
  }
  
  @Get('my-history')
  @UseGuards(AuthGuard('jwt'))
  // Gunakan alias @Req() tersebut di sini
  async getUserHistory(@Req() req: any) {
    const userId = req.user.userId || req.user.id;
    
    // Catatan: Pastikan di service ada method getUserHistory. 
    // Jika kamu pakai getResult(userId), pastikan service tersebut mencari 
    // berdasarkan User ID, bukan Attempt ID.
    const history=  await this.attemptsService.getResultByUser(userId);
    return {
      success: true,
      message: 'Berhasil mengambil riwayat kuis',
      data: history, // <--- Ini yang dibaca oleh Frontend
    };
  }

  @Get('bab/history/:id')
  @UseGuards(AuthGuard('jwt'))
  // Gunakan alias @Req() tersebut di sini
  async getUserHistoryBab(@Param('id') id: string, @Req() req: any) {
    // const userId = req.user.userId || req.user.id;
    
    // Catatan: Pastikan di service ada method getUserHistory. 
    // Jika kamu pakai getResult(userId), pastikan service tersebut mencari 
    // berdasarkan User ID, bukan Attempt ID.
    const history=  await this.attemptsService.getResultByBab(id);
    return {
      success: true,
      message: 'Berhasil mengambil riwayat kuis by bab',
      data: history, // <--- Ini yang dibaca oleh Frontend
    };
  }

  @Post(':id/pay')
    @UseGuards(AuthGuard('jwt')) // Tambahkan Guard agar req.user tersedia
    async getPaymentToken(@Param('id') id: string, @Req() req: any) {
      // Pastikan mengambil ID user dengan benar (tergantung isi payload JWT kamu)
      const userId = req.user.userId || req.user.id; 
      
      // Cari data enrollment
      const enrollment = await this.enrollmentService.findByIdAndUser(id, userId);
      
      if (!enrollment) throw new NotFoundException('Data tidak ditemukan');
      if (enrollment.status === 'success') return { message: 'Sudah lunas' };

      // Minta token ke Midtrans. req.user dikirim untuk ambil email/nama
      const snapToken = await this.midtransService.createSnapToken(enrollment, req.user);

      return {
        success: true,
        snapToken,
      };
    }

  // Di dalam handleMidtransWebhook
// enrollment.controller.ts

  @Post('webhook/midtrans')
  @HttpCode(200)
  async handleMidtransWebhook(@Body() body: any) {
    const { order_id, transaction_status, fraud_status } = body;

    // 1. Validasi: Jika ini adalah testing dari Midtrans, abaikan saja
    if (!Types.ObjectId.isValid(order_id)) {
      this.logger.log(`Abaikan testing notifikasi: ${order_id}`);
      return { status: 'OK', message: 'Test notification ignored' };
    }

    this.logger.log(`Webhook asli diterima [${transaction_status}] untuk Order: ${order_id}`);

    // 2. Logika Pembayaran Berhasil
    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      if (fraud_status === 'accept' || !fraud_status) {
        // Kita kirim seluruh 'body' agar service bisa mencatat detail transaksinya
        await this.enrollmentService.activateModule(order_id, body);
      }
    } 
    
    // 3. Logika Pembayaran Gagal/Expired (Tetap catat riwayatnya agar user tahu kenapa gagal)
    else if (['cancel', 'deny', 'expire'].includes(transaction_status)) {
      await this.enrollmentService.handleFailedPayment(order_id, body);
    }

    return { status: 'OK' };
  }


  // enrollments.controller.ts

  @UseGuards(AuthGuard('jwt'))
  @Get('transactions/history')
  @ApiOperation({ summary: 'Melihat riwayat transaksi pembayaran user' })
  async getHistory(@Req() req) {
    const userId = req.user.userId || req.user.id;
    const history = await this.enrollmentService.getTransactionHistory(userId);
    
    return {
      success: true,
      data: history
    };
  }

  @Get('transactions/invoice/:id')
  @UseGuards(AuthGuard('jwt'))
  async downloadInvoice(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const buffer = await this.enrollmentService.generateInvoicePdf(id);
    
    // Mengatur header secara manual lewat objek res express
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${id}.pdf"`,
      'Content-Length': buffer.length,
    });

    // Gunakan StreamableFile agar NestJS yang menangani pengirimannya
    return new StreamableFile(buffer);
  }

}