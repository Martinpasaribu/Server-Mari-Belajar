/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, ConflictException, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Enrollment } from './schemas/enrollment.schema';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { SubCategory } from '../sub-categories/schemas/sub-category.schema';
import { User } from '../users/schemas/user.schema';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Transaction } from '../payments/schemas/transaction.schema';
import { MailerService } from '@nestjs-modules/mailer';
import { DeliveryService } from '../delivery/delivery.service';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class EnrollmentService {
  private readonly logger = new Logger(EnrollmentService.name);

  constructor(
    @InjectModel(Enrollment.name) private enrollmentModel: Model<Enrollment>,
    @InjectModel(SubCategory.name) private subCategoryModel: Model<SubCategory>,
    @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly deliveryService: DeliveryService,
  ) {}

  /**
   * 1. CREATE ENROLLMENT (Checkout/Beli)
   */
  async createEnrollment(dto: CreateEnrollmentDto) {
    // Cek SubCategory
    const subCat = await this.subCategoryModel.findById(dto.sub_category_key);
    if (!subCat) throw new NotFoundException('SubCategory tidak ditemukan');

    // Tentukan status berdasarkan jenis modul
    const isFree = subCat.isFree === true;
    const finalStatus = isFree ? 'success' : (dto.status || 'pending');
    const finalSettled = isFree ? true : (dto.settled || false);
    
    // LOGIKA PERBAIKAN: isActive harus True jika status-nya success
    const finalIsActive = finalStatus === 'success';

    // Hitung Expired
    const duration = subCat.accessDurationDays || 31;
    const expiredAt = new Date();
    expiredAt.setDate(expiredAt.getDate() + duration);

    try {
      const newEnrollment = new this.enrollmentModel({
        ...dto,
        user_key: new Types.ObjectId(dto.user_key),
        expiredAt: dto.expiredAt || expiredAt,
        status: finalStatus,
        settled: finalSettled,
        isActive: finalIsActive, // <--- Sekarang sinkron dengan finalStatus
      });
      
      const savedEnrollment = await newEnrollment.save();

      // SYNC: Jika status success (baik karena gratis atau input manual admin)
      if (savedEnrollment.status === 'success') {
        await this.syncUserAccess(
          savedEnrollment.user_key.toString(),
          subCat._id as Types.ObjectId
        );
      }

      return savedEnrollment;
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ConflictException(`User sudah terdaftar di modul ini: ${subCat.name}`);
      }
      throw error;
    }
  }
  
  /**
   * 2. FIND BY USER (Daftar belanja user)
   */
  async findByUser(userId: string) {
    return this.enrollmentModel
      .find({ user_key: new Types.ObjectId(userId) })
      .populate('sub_category_key')
      .sort({ createdAt: -1 })
      .exec();
  }

    /**
   * 2. FIND BY USER (Daftar belanja user)
   */
  async findByUserModules(userId: string) {
    return this.enrollmentModel
      .find({ user_key: new Types.ObjectId(userId), status: 'success', isActive: true })
      .populate('sub_category_key')
      .sort({ createdAt: -1 })
      .exec();
  }


  /**
   * 3. HAS ACCESS (Check logic)
   */
  async hasAccess(userId: string, subCategoryId: string): Promise<boolean> {
    const enrollment = await this.enrollmentModel.findOne({
      user_key: userId,
      sub_category_key: subCategoryId,
      status: 'success',
      isActive: true,
      expiredAt: { $gt: new Date() } // Masih berlaku
    });

    return !!enrollment;
  }

  /**
   * 4. UPDATE STATUS (Untuk Webhook Payment/Admin)
   */
  async updateStatus(id: string, status: string) {
    const enrollment = await this.enrollmentModel.findByIdAndUpdate(
      id, 
      { status }, 
      { new: true }
    );
    
    if (!enrollment) throw new NotFoundException('Data tidak ditemukan');

    // Jika berubah jadi success, sync ke user
    if (status === 'success') {
      await this.syncUserAccess(enrollment.user_key.toString(), enrollment.sub_category_key);
    }

    return enrollment;
  }

  /**
   * HELPER: Sync array purchased_modules di User
   */
  private async syncUserAccess(userId: string, subCatId: Types.ObjectId) {
    await this.userModel.findByIdAndUpdate(userId, {
      $addToSet: { purchased_modules: subCatId }
    });
  }

  /**
   * 6. GRANT GIFT ACCESS (Admin Only)
   * Memberikan akses manual tanpa proses bayar
   */
  async grantGiftAccess(userId: string, subCategoryId: string) {
    // Kita buat objek DTO secara manual untuk dikirim ke createEnrollment
    const giftDto: CreateEnrollmentDto = {
      user_key: new Types.ObjectId(userId),
      sub_category_key: new Types.ObjectId(subCategoryId),
      enrollment_type: 'gift',
      status: 'success',
      isActive: true,
      amountPaid: 0,
    };

    this.logger.log(`Admin memberikan akses hadiah: User ${userId} -> Modul ${subCategoryId}`);
    
    return this.createEnrollment(giftDto);
  }

  /**
   * 5. CRON JOB: Auto Expiry
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiredAccess() {
    this.logger.log('--- Cron Job: Checking Expired Access ---');
    const now = new Date();

    const expiredEnrollments = await this.enrollmentModel.find({
      expiredAt: { $lt: now },
      status: 'success',
      isActive: true,
    }).exec();

    for (const enrollment of expiredEnrollments) {
      try {
        await this.enrollmentModel.findByIdAndUpdate(enrollment._id, {
          status: 'expired',
          isActive: false,
        });

        await this.userModel.findByIdAndUpdate(enrollment.user_key, {
          $pull: { purchased_modules: enrollment.sub_category_key }
        });

        this.logger.log(`Akses dicabut: User ${enrollment.user_key} - Modul ${enrollment.sub_category_key}`);
      } catch (err) {
        this.logger.error(`Gagal mencabut akses ID: ${enrollment._id}`, err);
      }
    }
  }
  /**
   * Mengambil detail status enrollment berdasarkan ID
   */
  async checkStatus(id: string): Promise<any> {
    const enrollment = await this.enrollmentModel
      .findOne({ _id: id })
      .populate('sub_category_key', 'name image') // Ambil info modul
      .select('status amountPaid enrollment_type sub_category_key createdAt expiredAt') // Field terpilih
      .exec();

    if (!enrollment) {
      throw new NotFoundException('Data enrollment tidak ditemukan');
    }

    return enrollment;
  }

  // Pembelian dan pengaktifan module
  async activateModule(orderId: string, midtransData?: any) {
      const expiredDate = new Date();
      expiredDate.setFullYear(expiredDate.getFullYear() + 1);

      // 1. Update Enrollment
      const enrollment = await this.enrollmentModel.findByIdAndUpdate(
        orderId, 
        {
          status: 'success',
          isActive: true,
          expiredAt: expiredDate
        },
        { new: true }
      ).populate('sub_category_key');

      if (enrollment) {
        
        // 2. Simpan atau Update Riwayat Transaksi
        // Panggil fungsi dari DeliveryService tanpa await agar non-blocking
        const user = await this.userModel.findById(enrollment.user_key);

        this.deliveryService.sendPaymentSuccessEmail(
          user, 
          enrollment, 
          midtransData.gross_amount, 
          orderId
        );

        await this.transactionModel.findOneAndUpdate(
          { order_id: orderId },
          {
            enrollment_key: enrollment._id,
            user_key: enrollment.user_key,
            order_id: orderId,
            amount: enrollment.amountPaid,
            payment_type: midtransData?.payment_type || 'unknown',
            transaction_status: 'settlement',
            raw_midtrans_response: midtransData,
          },
          { upsert: true, new: true }
        );

        // 3. Sync User Access
        await this.syncUserAccess(
          enrollment.user_key.toString(), 
          enrollment.sub_category_key as any
        );
      }

      return enrollment;
  }

  async findByIdAndUser(id: string, userId: string) {
    return this.enrollmentModel
      .findOne({ 
        _id: new Types.ObjectId(id), 
        user_key: new Types.ObjectId(userId) 
      })
      .populate('sub_category_key') // Penting untuk ambil nama modul buat Midtrans
      .exec();
  }


  // Tambahan: Mencatat jika pembayaran gagal/expired
  async handleFailedPayment(orderId: string, midtransData: any) {
    await this.enrollmentModel.findByIdAndUpdate(orderId, { status: 'failed', isActive: false });
    
    await this.transactionModel.findOneAndUpdate(
      { order_id: orderId },
      {
        order_id: orderId,
        transaction_status: midtransData.transaction_status,
        raw_response: midtransData,
      },
      { upsert: true }
    );
  }

  async getTransactionHistory(userId: string) {
    return this.transactionModel.find({ user_key: new Types.ObjectId(userId) })
      .populate({
        path: 'enrollment_key',
        populate: { path: 'sub_category_key', select: 'name image' }
      })
      .sort({ createdAt: -1 })
      .exec();
  }
  


  async generateInvoicePdf(transactionId: string): Promise<Buffer> {
      const trx = await this.transactionModel.findById(transactionId)
        .populate({
          path: 'enrollment_key',
          populate: { path: 'sub_category_key' }
        })
        .populate('user_key')
        .lean() as any;

      if (!trx) throw new Error('Transaksi tidak ditemukan');

      return new Promise((resolve, reject) => {
        try {
          const PDFDoc = (PDFDocument as any).default || PDFDocument;
          const doc = new PDFDoc({ size: 'A4', margin: 0 });
          
          const chunks: any[] = [];
          doc.on('data', (chunk) => chunks.push(chunk));
          doc.on('end', () => resolve(Buffer.concat(chunks)));
          doc.on('error', (err) => reject(err));

          // --- 1. MODERN HEADER ---
          doc.rect(0, 0, 600, 120).fill('#6366f1');
          doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold')
            .text('MARI BELAJAR', 50, 45);
          doc.fontSize(10).font('Helvetica')
            .text('E-Learning & Digital Course Platform', 50, 75);
          
          // --- 2. STATUS BADGE (FIXED: Menggunakan roundedRect) ---
          doc.fillColor('#ffffff');
          doc.roundedRect(450, 45, 100, 30, 15).fill(); // 15 adalah radiusnya
          doc.fillColor('#16a34a').fontSize(11).font('Helvetica-Bold')
            .text('PAID', 450, 56, { width: 100, align: 'center' });

          const startY = 160;

          // --- 3. CUSTOMER & INVOICE INFO ---
          // Bill To
          doc.fillColor('#64748b').fontSize(9).font('Helvetica-Bold').text('DITAGIHKAN KEPADA:', 50, startY);
          doc.fillColor('#1e293b').fontSize(12).font('Helvetica-Bold').text(`${trx.user_key?.firstName || ''} ${trx.user_key?.lastName || 'User'}`.trim(), 50, startY + 15);
          doc.fillColor('#475569').fontSize(10).font('Helvetica').text(trx.user_key?.email || '-', 50, startY + 30);

          // Invoice Detail
          doc.fillColor('#64748b').fontSize(9).font('Helvetica-Bold').text('DETAIL INVOICE:', 350, startY);
          doc.fillColor('#1e293b').fontSize(10).font('Helvetica')
            .text(`No. Order:`, 350, startY + 15)
            .font('Helvetica-Bold').text(`${trx.order_id || '-'}`, 430, startY + 15);
          
          const tgl = trx.createdAt ? new Date(trx.createdAt) : new Date();
          doc.font('Helvetica').text(`Tanggal:`, 350, startY + 30)
            .text(`${tgl.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 430, startY + 30);
          
          doc.font('Helvetica').text(`Metode:`, 350, startY + 45)
            .text(`${(trx.payment_type || 'Manual').toUpperCase()}`, 430, startY + 45);

          // --- 4. TABLE SECTION ---
          const tableTop = 270;
          doc.rect(50, tableTop, 500, 30).fill('#f8fafc');
          doc.fillColor('#475569').fontSize(9).font('Helvetica-Bold').text('DESKRIPSI MODUL', 70, tableTop + 10);
          doc.text('TOTAL', 450, tableTop + 10, { width: 80, align: 'right' });

          // Row Data
          const rowY = tableTop + 45;
          doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold');
          const moduleName = trx.enrollment_key?.sub_category_key?.name || 'Modul Belajar';
          doc.text(moduleName, 70, rowY);
          
          const amount = trx.amount || 0;
          doc.text(`Rp ${amount.toLocaleString('id-ID')}`, 450, rowY, { width: 80, align: 'right' });

          // Line separator
          doc.moveTo(50, rowY + 25).lineTo(550, rowY + 25).lineWidth(0.5).strokeColor('#e2e8f0').stroke();

          // --- 5. TOTAL SECTION (FIXED: Menggunakan roundedRect) ---
          const summaryY = rowY + 60;
          doc.fillColor('#6366f1');
          doc.roundedRect(330, summaryY, 220, 50, 8).fill();
          
          doc.fillColor('#ffffff').fontSize(9).font('Helvetica').text('TOTAL PEMBAYARAN', 350, summaryY + 12);
          doc.fontSize(15).font('Helvetica-Bold').text(`Rp ${amount.toLocaleString('id-ID')}`, 350, summaryY + 25, { width: 180, align: 'right' });

          // --- 6. FOOTER ---
          doc.fillColor('#94a3b8').fontSize(8).font('Helvetica')
            .text('Invoice ini adalah bukti pembayaran yang sah dan diterbitkan secara elektronik.', 50, 750, { align: 'center', width: 500 });

          doc.end();
        } catch (err) {
          reject(err);
        }
      });
    }
}