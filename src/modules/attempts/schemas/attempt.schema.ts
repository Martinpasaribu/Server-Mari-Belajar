import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { fillAndStroke } from 'pdfkit';

@Schema({ _id: false })
class UserAnswer {
  @Prop({ type: Types.ObjectId, ref: 'Question', required: true })
  question_key!: Types.ObjectId;

  @Prop({ default: "" }) 
  answer_given!: string;

  @Prop({ default: false })
  is_correct!: boolean;

  // TAMBAHKAN INI (Opsional)
  @Prop()
  answered_at!: Date; 
}

const UserAnswerSchema = SchemaFactory.createForClass(UserAnswer);

@Schema({ timestamps: true })
export class Attempt extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: fillAndStroke })
  user_key!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Bab', required: true })
  bab_key!: Types.ObjectId;

  @Prop({ type: [UserAnswerSchema], default: [] })
  answers!: UserAnswer[];

  @Prop({ default: 0 })
  total_score!: number; // Skor akhir (0-100)

  @Prop({ default: 0 })
  correct_count!: number;

  @Prop({ default: 0 })
  wrong_count!: number;

  @Prop({ enum: ['in_progress', 'submitted', 'finished'], default: 'in_progress' })
  status!: string;

  @Prop()
  submitted_at!: Date;

  @Prop({ default: 0 })
  duration_seconds!: number;
}

export const AttemptSchema = SchemaFactory.createForClass(Attempt);