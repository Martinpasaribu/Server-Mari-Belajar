import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Enrollment, EnrollmentSchema } from './schemas/enrollment.schema';
import { User, UserSchema } from '../users/schemas/user.schema'; // Import Schema User
import { SubCategory, SubCategorySchema } from '../sub-categories/schemas/sub-category.schema';
import { EnrollmentService } from './enrollments.service';
import { EnrollmentController } from './enrollments.controller';
import { AttemptsModule } from '../attempts/attempts.module';
import { MidtransModule } from '../midtrans/midtrans.module';
import { Transaction, TransactionSchema } from '../payments/schemas/transaction.schema';
import { DeliveryModule } from '../delivery/delivery.module';

@Module({
  imports: [
    // Daftarkan semua model yang di-inject di service
    MongooseModule.forFeature([
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: User.name, schema: UserSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: SubCategory.name, schema: SubCategorySchema },
    ]),
    AttemptsModule,
    MidtransModule,
    DeliveryModule
  ],
  controllers: [EnrollmentController],
  providers: [EnrollmentService],
  exports: [EnrollmentService],
})
export class EnrollmentModule {}