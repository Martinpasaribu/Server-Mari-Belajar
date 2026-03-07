/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Prop, Schema, SchemaFactory  } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MediaObject, MediaObjectSchema } from 'src/modules/media/schema/media.schema';
import { Question } from 'src/modules/question/schemas/question.schema';

@Schema({ 
  timestamps: true, 
  toJSON: { virtuals: true }, 
  toObject: { virtuals: true } 
})

export class Bab extends Document {
    
  @Prop({ type: Types.ObjectId, ref: 'SubCategory', required: true , default: '' })
  sub_category_key!: Types.ObjectId;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Question' }], // Pakai 'Question' (Sesuai nama Class)
    default: []
  })
  question_keys!: Types.ObjectId[];

  @Prop({ required: true, trim: true , default: ''})
  name!: string;

  @Prop({ required: true, unique: true })
  slug!: string;

  @Prop({ default: '' })
  description!: string;

  @Prop({ default: '' })
  sub_description!: string;

  @Prop({ default: '' })
  content!: string; // Untuk teks materi/markdown

  // --- LOGIKA AKSES ---
  @Prop({ default: false })
  isFree!: boolean; // Trial mode: bisa diakses meski belum beli SubCategory

  @Prop({ type: MediaObjectSchema })
  icon!: MediaObject;

  @Prop({ type: MediaObjectSchema })
  document!: MediaObject;

  // --- MEDIA (Sesuai Permintaan) ---
  @Prop({ type: MediaObjectSchema })
  image_bg!: MediaObject;

  @Prop({ type: [MediaObjectSchema], default: [] })
  images!: MediaObject[];

  @Prop({ type: MediaObjectSchema })
  video_url!: MediaObject;
  
  // --- STATUS & SORTING ---
  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: false })
  isDeleted!: boolean;

  @Prop({ default: 0 })
  order!: number;

  @Prop({ required: true, default: 0 })
  duration!: number;
}

export const BabSchema = SchemaFactory.createForClass(Bab);

// Menambahkan Index agar pencarian per sub-kategori lebih cepat
BabSchema.index({ sub_category_key: 1, order: 1 });