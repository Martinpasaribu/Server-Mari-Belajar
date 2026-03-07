import { PartialType } from '@nestjs/swagger';
import { StartAttemptDto } from './create-attempt.dto';

export class UpdateAttemptDto extends PartialType(StartAttemptDto) {}
