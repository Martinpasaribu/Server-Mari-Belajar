/* eslint-disable max-len */
import { Module } from '@nestjs/common';
import { SubCategoriesService } from './sub-categories.service';
import { SubCategoriesController } from './sub-categories.controller';
import { SubCategorySchema } from './schemas/sub-category.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { MediaModule } from '../media/media.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
     MongooseModule.forFeature([
      { name: 'SubCategory', schema: SubCategorySchema }, // Tambahkan ini agar model terdaftar!
    ]),
    MediaModule,
    UsersModule
  ],

  controllers: [SubCategoriesController],
  providers: [SubCategoriesService],
  exports: [SubCategoriesService, MongooseModule], // Ekspor service agar bisa digunakan di module lain (misal CatalogsModule)
})
export class SubCategoriesModule {}
