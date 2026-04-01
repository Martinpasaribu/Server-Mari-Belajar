/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable max-len */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MediaObject, MediaObjectSchema } from 'src/modules/media/schema/media.schema';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ select: false }) // select: false agar password tidak ikut tertarik saat query biasa (keamanan)
  password?: string;

  @Prop({ required: true })
  firstname!: string;
  
  @Prop({ required: false })
  lastname!: string;

  @Prop({ type: String, enum: ['F', 'M', 'O'], default: 'O' })
  @Prop({ required: true })
  gender?: string;

  @Prop({ default: 0 })
  age!: number; 

  @Prop()
  title?: string; // Student, Designer, job seekers, etc

  @Prop({ type: [String] })
  goals!: string[];

  @Prop({ type: [String] })
  interested!: string[];

  @Prop({ type: MediaObjectSchema })
  avatar!: MediaObject;
  
  @Prop()
  location?: string;

  @Prop()
  phone?: string; // Seringkali dibutuhkan untuk integrasi payment gateway (seperti Midtrans/Xendit)

  // IDENTITAS PROVIDER
  @Prop({ enum: ['local', 'google'], default: 'local' })
  provider!: string;

  @Prop()
  googleId?: string;


  // SISTEM PEMBAYARAN & AKSES
  @Prop({ enum: ['free', 'premium', 'pro'], default: 'free' })
  account_type!: string;

  @Prop({ type: [Types.ObjectId], ref: 'Bab' }) // List ID Bab/Modul yang sudah dibeli user
  purchased_modules!: Types.ObjectId[];

  @Prop()
  subscription_end_date?: Date; // Jika kamu pakai sistem langganan bulanan

  // DATA TAMBAHAN
  @Prop({ default: true })
  isActive!: boolean;

    @Prop({ default: false })
  isDeleted!: boolean;

  @Prop({ default: 'student' }) // student, teacher, atau admin
  role!: string;

  // --- KEAMANAN & VERIFIKASI ---
  @Prop({ default: false })
  isEmailVerified!: boolean; // Penting untuk mencegah spam/fake email di login local

  @Prop()
  verificationToken?: string; // Token untuk aktivasi email

  @Prop()
  resetPasswordToken?: string; // Token untuk fitur lupa password

  @Prop()
  resetPasswordExpires?: Date;

  // --- ANALITIK & USER EXPERIENCE ---
  @Prop()
  lastLogin?: Date; // Untuk memantau keaktifan user

  // --- PROGRESS BELAJAR ---
  @Prop({ type: [{ bab_key: { type: Types.ObjectId, ref: 'Bab' }, last_accessed: Date }] })
  learning_progress!: any[]; // Untuk fitur "Lanjutkan Belajar" di Dashboard

}

export const UserSchema = SchemaFactory.createForClass(User);

// Tambahkan manual index jika diperlukan
UserSchema.index({ email: 1 });
UserSchema.index({ googleId: 1 });
UserSchema.index({ email: 1 });