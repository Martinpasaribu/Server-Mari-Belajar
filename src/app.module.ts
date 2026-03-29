/* eslint-disable @typescript-eslint/no-unused-vars */
import { Module, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { MongooseModule, InjectConnection } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Connection } from 'mongoose';
import { AppController } from './app.controller';

// import { RedisModule } from '@nestjs-modules/ioredis';
// import { RedisProvider } from './config/redis.provider';

import { VisitorModule } from './visitor/visitor.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { MediaModule } from './modules/media/media.module';
import { BabModule } from './modules/bab/bab.module';
import { QuestionModule } from './modules/question/question.module';
import { EnrollmentModule } from './modules/enrollments/enrollments.module';
import { SubCategoriesModule } from './modules/sub-categories/sub-categories.module';
import { AttemptsModule } from './modules/attempts/attempts.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogsModule } from './modules/catalogs/catalogs.module';
import { MidtransModule } from './modules/midtrans/midtrans.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { mailerConfig } from './config/email_sender/mailer.config';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { StatusModule } from './modules/status/status.module';
import { GuestModule } from './modules/guest/guest.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),

        // Second MongoDB connection for Users
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_USER_URI'),
      }),
      inject: [ConfigService],
      connectionName: 'usersConnection', // 👈 penting!
    }),

    MailerModule.forRootAsync({
      useFactory: () => mailerConfig(),
    }),
    
    VisitorModule,
    CategoriesModule,
    SubCategoriesModule,
    MediaModule,
    AuthModule,
    BabModule,
    QuestionModule,
    EnrollmentModule,
    AttemptsModule,
    ScheduleModule.forRoot(),
    CatalogsModule,
    MidtransModule,
    DeliveryModule,
    StatusModule,
    GuestModule,

    // RedisModule.forRootAsync({
    //   imports: [ConfigModule],
    //   inject: [ConfigService],
    //   useFactory: (config: ConfigService) => ({
    //     url: config.get<string>('REDIS_URL'), // Gunakan 'url' BUKAN 'uri'
    //     type: 'single', // opsional, kalau kamu yakin Redis-mu single instance
    //   }),
    // }),
  ],

  providers: [],
  exports: [],
  
  controllers: [AppController],
})
export class AppModule implements OnApplicationBootstrap {
  private readonly logger = new Logger('MongoDB');

  constructor(@InjectConnection() private readonly connection: Connection) {}

  onApplicationBootstrap() {
    // Tunggu sebentar agar event listener terpasang setelah koneksi dibuka
    setTimeout(() => {
      this.connection.on('connected', () => {
        this.logger.log('✅ MongoDB terhubung');
      });

      this.connection.on('disconnected', () => {
        this.logger.warn('⚠️ MongoDB terputus');
      });

      this.connection.on('error', (err) => {
        this.logger.error(`❌ MongoDB error: ${err}`);
      });

      // Jika sudah terkoneksi saat ini
      // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
      if (this.connection.readyState === 1) {
        this.logger.log('✅ MongoDB sudah terhubung saat init');
        this.logger.log(`📂 Database: ${this.connection.name}`);
      }
    }, 100); // 100 ms delay cukup aman
  }
}
