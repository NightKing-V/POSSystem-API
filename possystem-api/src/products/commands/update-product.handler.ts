import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UpdateProductCommand } from './update-product.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(UpdateProductCommand)
export class UpdateProductHandler implements ICommandHandler<UpdateProductCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateProductCommand) {
    const { id, updateProductDto } = command;

    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    if (updateProductDto.subcategoryid) {
      const category = await this.prisma.productCategory.findUnique({
        where: { id: updateProductDto.subcategoryid },
      });
      if (!category) {
        throw new NotFoundException(
          `Category with ID "${updateProductDto.subcategoryid}" not found`,
        );
      }
      if (category.org_id !== product.org_id) {
        throw new BadRequestException(
          `Category with ID "${updateProductDto.subcategoryid}" does not belong to organization "${product.org_id}"`,
        );
      }
    }

    if (updateProductDto.brandid) {
      const brand = await this.prisma.brand.findUnique({
        where: { id: updateProductDto.brandid },
      });
      if (!brand) {
        throw new NotFoundException(
          `Brand with ID "${updateProductDto.brandid}" not found`,
        );
      }
      if (brand.org_id !== product.org_id) {
        throw new BadRequestException(
          `Brand with ID "${updateProductDto.brandid}" does not belong to organization "${product.org_id}"`,
        );
      }
    }

    if (updateProductDto.supplier_id) {
      const supplier = await this.prisma.supplier.findUnique({
        where: { id: updateProductDto.supplier_id },
      });
      if (!supplier) {
        throw new NotFoundException(
          `Supplier with ID "${updateProductDto.supplier_id}" not found`,
        );
      }
      if (supplier.org_id !== product.org_id) {
        throw new BadRequestException(
          `Supplier with ID "${updateProductDto.supplier_id}" does not belong to organization "${product.org_id}"`,
        );
      }
    }

    if (updateProductDto.SKU && updateProductDto.SKU !== product.SKU) {
      const existingSku = await this.prisma.product.findUnique({
        where: {
          org_id_SKU: {
            org_id: product.org_id,
            SKU: updateProductDto.SKU,
          },
        },
      });
      if (existingSku) {
        throw new BadRequestException(
          `Product with SKU "${updateProductDto.SKU}" already exists in this organization`,
        );
      }
    }

    if (
      updateProductDto.barcode &&
      updateProductDto.barcode !== product.barcode
    ) {
      const existingBarcode = await this.prisma.product.findUnique({
        where: {
          org_id_barcode: {
            org_id: product.org_id,
            barcode: updateProductDto.barcode,
          },
        },
      });
      if (existingBarcode) {
        throw new BadRequestException(
          `Product with barcode "${updateProductDto.barcode}" already exists in this organization`,
        );
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        name: updateProductDto.name,
        subcategoryid: updateProductDto.subcategoryid,
        brandid: updateProductDto.brandid,
        supplier_id: updateProductDto.supplier_id,
        SKU: updateProductDto.SKU,
        barcode: updateProductDto.barcode,
      },
      include: {
        category: true,
        brand: true,
        supplier: true,
        prices: true,
      },
    });
  }
}
