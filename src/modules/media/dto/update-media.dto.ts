import { PartialType } from '@nestjs/swagger';
import { MediaObjectDto } from './create-media.dto';

export class UpdateMediaDto extends PartialType(MediaObjectDto) {}
