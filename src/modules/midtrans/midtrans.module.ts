/* eslint-disable @typescript-eslint/no-unused-vars */

import { Module } from '@nestjs/common';
import { MidtransService } from './midtrans.service';
// import { MidtransController } from './midtrans.controller';

@Module({
  // controllers: [MidtransController],
  providers: [MidtransService],
  exports:[MidtransService]
})
export class MidtransModule {}
