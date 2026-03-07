// src/modules/categories/categories.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { Category, CategorySchema } from './schemas/category.schema';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [
    // Daftarkan model agar bisa di-inject ke service
    MongooseModule.forFeature([{ name: Category.name, schema: CategorySchema }]),
    MediaModule,
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService], // Export agar bisa dipakai module lain (misal: SubCategory)
})
export class CategoriesModule {}