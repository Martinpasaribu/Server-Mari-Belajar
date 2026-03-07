// src/main.vercel.ts
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { Express } from 'express';
import { AppModule } from 'src/app.module';

async function bootstrap(): Promise<Express> {
  const app = await NestFactory.create(AppModule, new ExpressAdapter());
  await app.init();
  return app.getHttpAdapter().getInstance() as Express;
}

export default bootstrap();
