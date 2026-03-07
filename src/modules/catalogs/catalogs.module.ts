import { Module } from '@nestjs/common';
import { SubCategoriesModule } from '../sub-categories/sub-categories.module';
import { CatalogController } from './catalogs.controller';
import { CatalogService } from './catalogs.service';
import { BabModule } from '../bab/bab.module';

@Module({
    imports: [
      SubCategoriesModule,
      BabModule
    ],
  controllers: [CatalogController],
  providers: [CatalogService],
})
export class CatalogsModule {}
