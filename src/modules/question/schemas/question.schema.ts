/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MediaObject, MediaObjectSchema } from '../../media/schema/media.schema';

@Schema({ _id: false })
class Option {
  @Prop({ required: false })
  label!: string; // A, B, C, D, atau E

  @Prop({ required: false })
  text!: string; // Isi teks jawaban (opsional jika jawaban berupa gambar)

  @Prop({ type: MediaObjectSchema })
  image!: MediaObject; // Digunakan jika tipe soal adalah 'image_options'
}

class section {
  @Prop({ required: false })
  label!: string; 

  @Prop({ required: false })
  name!: string; // Isi teks jawaban (opsional jika jawaban berupa gambar)

}

class Source {
  @Prop({ required: false })
  name!: string; 

  @Prop({ required: false })
  link!: string; // Isi teks jawaban (opsional jika jawaban berupa gambar)

  @Prop({ type: MediaObjectSchema })
  image!: MediaObject; // Digunakan jika tipe soal adalah 'image_options'
}

const SourceSchema = SchemaFactory.createForClass(Source);

const OptionSchema = SchemaFactory.createForClass(Option);

@Schema({ 
  timestamps: true, 
  toJSON: { virtuals: true }, 
  toObject: { virtuals: true } 
})

export class Question extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Bab', required: true })
  bab_key!: Types.ObjectId;

  // cara 2: langsung simpan ObjectId, tapi pastikan di DTO sudah benar-benar ObjectId
  // @Prop({ 
  //   type: Types.ObjectId, 
  //   ref: 'babs', 
  //   required: true,
  //   set: (v: any) => new Types.ObjectId(v) // <--- Konversi otomatis di level Database
  // })
  // bab_key!: Types.ObjectId;

  // --- TIPE SOAL ---
  @Prop({ 
    required: true, 
    enum: ['multiple_choice', 'essay', 'image_options'], 
    default: 'multiple_choice' 
  })
  type!: string;

  @Prop({ required: true, trim: true })
  question_text!: string;

  @Prop({ 
    type: Object, // Atau gunakan Schema jika 'section' adalah sub-schema
    required: false, 
    default: null 
  })
  section?: section | null;

  @Prop({ required: true, trim: true })
  question_text_base!: string;

  @Prop({ required: false, trim: true, unique: true })
  code!: string;

  // --- MULTIMEDIA SOAL ---
  @Prop({ type: MediaObjectSchema })
  question_audio!: MediaObject; // Untuk soal Listening/Suara

  @Prop({ type: [MediaObjectSchema], default: [] })
  question_images!: MediaObject[]; // Untuk soal dengan gambar pendukung

  // --- PILIHAN JAWABAN ---
  @Prop({ type: [OptionSchema], default: [] })
  options!: Option[]; // Kosong jika tipe 'essay'

    // --- PILIHAN source ---
  @Prop({ type: [SourceSchema], default: {} })
  source!: Source[]; // Kosong jika tipe 'essay'

  @Prop({ required: true })
  correct_answer!: string; // Label (A/B/C) atau Kunci Jawaban (untuk Essay)

  // --- PEMBAHASAN (WAJIB) ---
  @Prop({ required: true })
  discussion_text!: string;

  @Prop({ required: true })
  discussion_text_base!: string;

  @Prop({ type: MediaObjectSchema })
  discussion_video!: MediaObject; // Pembahasan versi video (opsional)

  // --- SYSTEM ---
  @Prop({ default: 0 })
  order!: number; // Urutan nomor soal

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: false })
  isDeleted!: boolean;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);

// Index agar pencarian soal per Bab sangat cepat
QuestionSchema.index({ bab_key: 1, order: 1 });