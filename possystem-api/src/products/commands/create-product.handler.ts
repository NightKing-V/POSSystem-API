import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateProductCommand } from './create-product.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(CreateProductCommand)
export class CreateProductHandler implements ICommandHandler<CreateProductCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateProductCommand) {
    const { createProductDto } = command;

    const category = await this.prisma.productCategory.findUnique({
      where: { id: createProductDto.subcategoryid },
    });
    if (!category) {
      throw new NotFoundException(
        `Category with ID "${createProductDto.subcategoryid}" not found`,
      );
    }

    if (createProductDto.brandid) {
      const brand = await this.prisma.brand.findUnique({
        where: { id: createProductDto.brandid },
      });
      if (!brand) {
        throw new NotFoundException(`Brand with ID "${createProductDto.brandid}" not found`);
      }
    }

    if (createProductDto.supplier_id) {
      const supplier = await this.prisma.supplier.findUnique({
        where: { id: createProductDto.supplier_id },
      });
      if (!supplier) {
        throw new NotFoundException(`Supplier with ID "${createProductDto.supplier_id}" not found`);
      }
    }

    const sku = createProductDto.SKU || (await this.generateUniqueSKU());
    const barcode = createProductDto.barcode || (await this.generateUniqueBarcode());

    if (createProductDto.SKU) {
      const existingSku = await this.prisma.product.findUnique({
        where: { SKU: sku },
      });
      if (existingSku) {
        throw new BadRequestException(`Product with SKU "${sku}" already exists`);
      }
    }

    if (createProductDto.barcode) {
      const existingBarcode = await this.prisma.product.findUnique({
        where: { barcode },
      });
      if (existingBarcode) {
        throw new BadRequestException(`Product with barcode "${barcode}" already exists`);
      }
    }

    const product = await this.prisma.product.create({
      data: {
        name: createProductDto.name,
        subcategoryid: createProductDto.subcategoryid,
        brandid: createProductDto.brandid || null,
        supplier_id: createProductDto.supplier_id || null,
        SKU: sku,
        barcode: barcode,
      },
    });

    if (createProductDto.initialPrice !== undefined) {
      await this.prisma.productPrice.create({
        data: {
          productid: product.id,
          price: createProductDto.initialPrice,
          isdefault: true,
        },
      });
    }

    return this.prisma.product.findUnique({
      where: { id: product.id },
      include: {
        category: true,
        brand: true,
        supplier: true,
        prices: true,
        _count: {
          select: {
            stock_batches: true,
            po_items: true,
            bill_items: true,
          },
        },
      },
    });
  }

  private async generateUniqueSKU(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let isUnique = false;
    let sku = '';
    while (!isUnique) {
      sku = 'PROD-';
      for (let i = 0; i < 7; i++) {
        sku += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const existing = await this.prisma.product.findUnique({
        where: { SKU: sku },
      });
      if (!existing) {
        isUnique = true;
      }
    }
    return sku;
  }

  private async generateUniqueBarcode(): Promise<string> {
    let isUnique = false;
    let barcode = '';
    while (!isUnique) {
      barcode = '880' + Math.floor(100000000 + Math.random() * 900000000).toString();
      const existing = await this.prisma.product.findUnique({
        where: { barcode },
      });
      if (!existing) {
        isUnique = true;
      }
    }
    return barcode;
  }
}
