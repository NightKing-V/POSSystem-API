import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductPriceDto } from './dto/create-product-price.dto';
import { UpdateProductPriceDto } from './dto/update-product-price.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  // ==========================================
  // PRODUCT PRICING ENDPOINTS
  // ==========================================

  @Post(':productId/prices')
  createPrice(
    @Param('productId') productId: string,
    @Body() createPriceDto: CreateProductPriceDto,
  ) {
    return this.productsService.createPrice(productId, createPriceDto);
  }

  @Get(':productId/prices')
  findAllPrices(@Param('productId') productId: string) {
    return this.productsService.findAllPrices(productId);
  }

  @Patch('prices/:priceId')
  updatePrice(
    @Param('priceId') priceId: string,
    @Body() updatePriceDto: UpdateProductPriceDto,
  ) {
    return this.productsService.updatePrice(priceId, updatePriceDto);
  }

  @Delete('prices/:priceId')
  removePrice(@Param('priceId') priceId: string) {
    return this.productsService.removePrice(priceId);
  }
}

