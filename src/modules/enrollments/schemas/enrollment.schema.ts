import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Enrollment extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  user_key!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SubCategory', required: true })
  sub_category_key!: Types.ObjectId;

  @Prop({ 
    type: String, 
    enum: ['pending', 'success', 'expired', 'cancelled'], 
    default: 'success' 
  })
  status!: string;

  @Prop({ enum: ['free', 'purchased', 'gift'], default: 'purchased' })
  enrollment_type!: string;

  @Prop({ default: 0 })
  amountPaid!: number;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: false })
  settled!: boolean;

  @Prop()
  expiredAt!: Date;

  @Prop()
  createdAt!: Date;
}

export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);

// Index unik agar satu user tidak membeli paket yang sama dua kali
EnrollmentSchema.index({ user_key: 1, sub_category_key: 1 }, { unique: true });