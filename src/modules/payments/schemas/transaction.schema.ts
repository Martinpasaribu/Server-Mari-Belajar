import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Transaction extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Enrollment', required: true })
  enrollment_key!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_key!: Types.ObjectId;

  @Prop()
  order_id!: string; // ID dari Midtrans

  @Prop()
  amount!: number;

  @Prop()
  payment_type!: string; // misal: gopay, cva, credit_card

  @Prop()
  transaction_status!: string; // settlement, pending, expire

  @Prop({ type: Object })
  raw_midtrans_response: any; // Simpan semua data dari Midtrans untuk jaga-jaga
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);