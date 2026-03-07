/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Controller, Get, Query, Param } from '@nestjs/common';
import { CatalogService } from './catalogs.service';

@Controller('catalogs')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  async findAll(@Query() query: any) {
    const data = await this.catalogService.getPublicCatalogs(query);
    return {
      success: true,
      message: 'Katalog berhasil dimuat',
      data: data
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.catalogService.getCatalogById(id);
    return {
      success: true,
      data: data
    }; 
  }
}