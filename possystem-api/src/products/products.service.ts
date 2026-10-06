import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductPriceDto } from './dto/create-product-price.dto';
import { UpdateProductPriceDto } from './dto/update-product-price.dto';
import { CreateProductCommand } from './commands/create-product.command';
import { UpdateProductCommand } from './commands/update-product.command';
import { DeleteProductCommand } from './commands/delete-product.command';
import { CreateProductPriceCommand } from './commands/create-product-price.command';
import { UpdateProductPriceCommand } from './commands/update-product-price.command';
import { DeleteProductPriceCommand } from './commands/delete-product-price.command';
import { GetProductsQuery } from './queries/get-products.query';
import { GetProductQuery } from './queries/get-product.query';
import { GetProductPricesQuery } from './queries/get-product-prices.query';

@Injectable()
export class ProductsService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async create(createProductDto: CreateProductDto) {
    return this.commandBus.execute(new CreateProductCommand(createProductDto));
  }

  async findAll(orgId?: string) {
    return this.queryBus.execute(new GetProductsQuery(orgId));
  }

  async findOne(id: string) {
    return this.queryBus.execute(new GetProductQuery(id));
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    return this.commandBus.execute(
      new UpdateProductCommand(id, updateProductDto),
    );
  }

  async remove(id: string) {
    return this.commandBus.execute(new DeleteProductCommand(id));
  }

  // ==========================================
  // PRODUCT PRICING LOGIC
  // ==========================================

  async createPrice(productId: string, createPriceDto: CreateProductPriceDto) {
    return this.commandBus.execute(
      new CreateProductPriceCommand(productId, createPriceDto),
    );
  }

  async findAllPrices(productId: string) {
    return this.queryBus.execute(new GetProductPricesQuery(productId));
  }

  async updatePrice(priceId: string, updatePriceDto: UpdateProductPriceDto) {
    return this.commandBus.execute(
      new UpdateProductPriceCommand(priceId, updatePriceDto),
    );
  }

  async removePrice(priceId: string) {
    return this.commandBus.execute(new DeleteProductPriceCommand(priceId));
  }
}
