/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import mongoose from 'mongoose';
import { json, urlencoded } from 'express';
import { RateLimitMiddleware } from './common/middleware/rate-limit.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: ['http://localhost:3000','http://localhost:3001',
       'http://localhost:3002', 'https://www.clickusaha.com',
       'https://management-clickusaha.vercel.app',
       'https://client-mari-belajar.vercel.app','https://admin-mari-belajar.vercel.app'], // array of allowed origins
    credentials: true, // izinkan kirim cookie/token cross-origin
  });

  // Naikkan limit body parser express
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: false, // JANGAN lempar error jika ada data asing
    transform: true, // INI KUNCINYA
      transformOptions: {
        enableImplicitConversion: true, // Tambahkan ini juga
      },  
  }));

// ceks
    // Middleware global
  // eslint-disable-next-line @typescript-eslint/unbound-method
  // app.use(new RateLimitMiddleware().use);

  const port = process.env.PORT || 5002;
  const logger = new Logger('Bootstrap');

  
  // Swagger setup

  const config = new DocumentBuilder()
    .setTitle('Blog API')
    .setDescription('Dokumentasi API Blog')
    .setVersion('1.0')
    .addServer('/api/v1') // tambahkan ini
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // MongoDB Connection Logging
  mongoose.connection.on('connected', () => {
    logger.log('✅ Terhubung ke MongoDB');
  });

  mongoose.connection.on('error', (err) => {
    logger.error(`❌ Gagal terhubung ke MongoDB: ${err}`);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('⚠️ Koneksi ke MongoDB terputus');
  });

  app.setGlobalPrefix('api/v1');

  await app.listen(port);
  logger.log(`🚀 Server berjalan di http://localhost:${port}`);
}

bootstrap();
