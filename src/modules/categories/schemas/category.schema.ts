// src/modules/categories/schemas/category.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { MediaObject, MediaObjectSchema } from 'src/modules/media/schema/media.schema';

@Schema({ 
  timestamps: true, // Otomatis menambahkan 'createdAt' dan 'updatedAt'
  toJSON: { virtuals: true }, // Agar field virtual muncul saat diubah jadi JSON
  toObject: { virtuals: true } 
})
export class Category extends Document {
  @Prop({ required: true, unique: true, trim: true })
  name!: string;

  @Prop()
  slug!: string; // Contoh: "cpns-indonesia" untuk URL yang SEO friendly

  @Prop()
  description!: string;

  @Prop()
  sub_description!: string;

// Gunakan MediaObjectSchema agar validasi internal Mongoose jalan
  @Prop({ type: MediaObjectSchema })
  icon!: MediaObject;

  @Prop({ type: MediaObjectSchema })
  image_bg!: MediaObject;

  // Untuk array, gunakan [MediaObjectSchema]
  @Prop({ type: [MediaObjectSchema], default: [] })
  images!: MediaObject[];

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: 0 })
  order!: number; // Untuk mengurutkan kategori (misal CPNS mau di nomor 1)

  @ApiProperty({ default: false })
  @Prop({ type: Boolean, default: false })
  isDeleted!: boolean;

}

export const CategorySchema = SchemaFactory.createForClass(Category);

// --- VIRTUAL FIELD (Penting untuk statistik) ---

// Menghitung jumlah Sub-Category secara otomatis tanpa disimpan manual
CategorySchema.virtual('subCategoryCount', {
  ref: 'SubCategory',      // Merujuk ke model SubCategory
  localField: '_id',       // Field di Category ini
  foreignField: 'category_key', // Field di SubCategory yang merujuk ke sini
  count: true              // Hanya ambil jumlahnya saja
});