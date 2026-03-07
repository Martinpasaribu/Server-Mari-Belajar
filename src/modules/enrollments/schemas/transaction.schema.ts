import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Transaction extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  user_key!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Enrollment', required: true })
  enrollment_key!: Types.ObjectId;

  @Prop({ 
    type: String, 
    enum: ['settlement', 'pending', 'expired', 'cancelled'], 
    default: 'pending' 
  })
  transaction_status!: string;

  @Prop({ default: '' })
  payment_type!: string;

  @Prop({default: {} })
  raw_midtrans_response!: any;

  @Prop({ default: 0 })
  amount!: number;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop()
  expiredAt!: Date;

  @Prop()
  createdAt!: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

// Index unik agar satu user tidak membeli paket yang sama dua kali
TransactionSchema.index({ user_key: 1, enrollment_key: 1 }, { unique: true });