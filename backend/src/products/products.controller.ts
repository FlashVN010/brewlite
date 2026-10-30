import { Controller, Get, Param, ParseEnumPipe, ParseIntPipe, Query } from '@nestjs/common';
import { ProductCategory } from '@prisma/client';
import { ProductsService } from './products.service';
import { ProductDto } from './dto/product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async getProducts(
    @Query('category', new ParseEnumPipe(ProductCategory, { optional: true }))
    category?: ProductCategory,
  ): Promise<ProductDto[]> {
    return this.productsService.findAll(category);
  }

  @Get(':id')
  async getProductById(@Param('id', ParseIntPipe) id: number): Promise<ProductDto> {
    return this.productsService.findOne(id);
  }
}