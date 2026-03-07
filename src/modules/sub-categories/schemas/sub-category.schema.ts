/* eslint-disable max-len */
// src/modules/sub-categories/schemas/sub-category.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MediaObject, MediaObjectSchema } from 'src/modules/media/schema/media.schema';

@Schema({ 
  timestamps: true, 
  toJSON: { virtuals: true }, 
  toObject: { virtuals: true } 
})
export class SubCategory extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  category_key!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true })
  slug!: string;

  @Prop({ default: '' })
  description!: string;

  @Prop({ default: '' })
  sub_description!: string;

  // --- FIELD PENDUKUNG ENROLLMENT & AKSES ---
  
  @Prop({ default: false })
  isFree!: boolean; // Jika true, abaikan harga dan biarkan semua user akses

  // Tambahkan di SubCategory
  @Prop({ 
    type: String, 
    enum: ['free', 'premium'], 
    default: 'free' 
  })
  access_level!: string;

  @Prop({ default: 0 })
  price!: number;

  @Prop({ default: 0 })
  discountPrice!: number;

  @Prop({ default: 365 })
  accessDurationDays!: number; // Durasi akses (misal: 365 hari setelah beli)

  // --- MEDIA ---

  @Prop({ type: MediaObjectSchema })
  icon!: MediaObject;

  @Prop({ type: MediaObjectSchema })
  image_bg!: MediaObject;

  @Prop({ type: [MediaObjectSchema], default: [] })
  images!: MediaObject[];

  // --- STATUS & SORTING ---

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: false })
  isDeleted!: boolean;

  @Prop({ default: 0 })
  order!: number;
}

export const SubCategorySchema = SchemaFactory.createForClass(SubCategory);

// Virtual field untuk mengecek Enrollment (Opsional jika ingin di-populate)
SubCategorySchema.virtual('userEnrollment', {
  ref: 'Enrollment',
  localField: '_id',
  foreignField: 'subCategoryId',
  justOne: true
});

// PERBAIKAN PADA SUB-CATEGORY SCHEMA
SubCategorySchema.virtual('babCount', {
  ref: 'Bab',              // Harus Case Sensitive sesuai nama class
  localField: '_id',       
  foreignField: 'sub_category_key', // GANTI: tadinya 'bab_key', seharusnya field yang merujuk ke SubCategory
  count: true              
});