// src/common/schemas/media.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class MediaObject {
  @Prop({ required: false })
  fieldName!: string;

  @Prop({ required: true })
  url!: string;

  @Prop({ required: true })
  fileId!: string;

  @Prop({ default: 'image' })
  fileType!: string; // 'image', 'audio', dll
}

export const MediaObjectSchema = SchemaFactory.createForClass(MediaObject);