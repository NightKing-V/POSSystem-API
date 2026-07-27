import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductPriceDto } from './dto/create-product-price.dto';
import { UpdateProductPriceDto } from './dto/update-product-price.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    // Verify category exists
    const category = await this.prisma.productCategory.findUnique({
      where: { id: createProductDto.subcategoryid },
    });
    if (!category) {
      throw new NotFoundException(
        `Category with ID "${createProductDto.subcategoryid}" not found`,
      );
    }

    // Verify brand if provided
    if (createProductDto.brandid) {
      const brand = await this.prisma.brand.findUnique({
        where: { id: createProductDto.brandid },
      });
      if (!brand) {
        throw new NotFoundException(`Brand with ID "${createProductDto.brandid}" not found`);
      }
    }

    // Verify supplier if provided
    if (createProductDto.supplier_id) {
      const supplier = await this.prisma.supplier.findUnique({
        where: { id: createProductDto.supplier_id },
      });
      if (!supplier) {
        throw new NotFoundException(`Supplier with ID "${createProductDto.supplier_id}" not found`);
      }
    }

    // Auto-generate SKU if not provided
    const sku = createProductDto.SKU || (await this.generateUniqueSKU());

    // Auto-generate barcode if not provided
    const barcode = createProductDto.barcode || (await this.generateUniqueBarcode());

    // Double check SKU uniqueness if it was provided
    if (createProductDto.SKU) {
      const existingSku = await this.prisma.product.findUnique({
        where: { SKU: sku },
      });
      if (existingSku) {
        throw new BadRequestException(`Product with SKU "${sku}" already exists`);
      }
    }

    // Double check Barcode uniqueness if it was provided
    if (createProductDto.barcode) {
      const existingBarcode = await this.prisma.product.findUnique({
        where: { barcode },
      });
      if (existingBarcode) {
        throw new BadRequestException(`Product with barcode "${barcode}" already exists`);
      }
    }

    // Create product
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

    // Create initial price if provided
    if (createProductDto.initialPrice !== undefined) {
      await this.prisma.productPrice.create({
        data: {
          productid: product.id,
          price: createProductDto.initialPrice,
          isdefault: true,
        },
      });
    }

    return this.findOne(product.id);
  }

  async findAll() {
    return this.prisma.product.findMany({
      include: {
        category: true,
        brand: true,
        supplier: true,
        prices: true,
      },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
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
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    await this.findOne(id);

    if (updateProductDto.subcategoryid) {
      const category = await this.prisma.productCategory.findUnique({
        where: { id: updateProductDto.subcategoryid },
      });
      if (!category) {
        throw new NotFoundException(
          `Category with ID "${updateProductDto.subcategoryid}" not found`,
        );
      }
    }

    if (updateProductDto.brandid) {
      const brand = await this.prisma.brand.findUnique({
        where: { id: updateProductDto.brandid },
      });
      if (!brand) {
        throw new NotFoundException(`Brand with ID "${updateProductDto.brandid}" not found`);
      }
    }

    if (updateProductDto.supplier_id) {
      const supplier = await this.prisma.supplier.findUnique({
        where: { id: updateProductDto.supplier_id },
      });
      if (!supplier) {
        throw new NotFoundException(`Supplier with ID "${updateProductDto.supplier_id}" not found`);
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

  async remove(id: string) {
    const product = await this.findOne(id);

    if (
      product._count.stock_batches > 0 ||
      product._count.po_items > 0 ||
      product._count.bill_items > 0
    ) {
      throw new BadRequestException(
        `Cannot delete product with ID "${id}" because it is referenced in stock batches, purchase orders, or bills.`,
      );
    }

    // Delete associated prices first
    await this.prisma.productPrice.deleteMany({
      where: { productid: id },
    });

    return this.prisma.product.delete({
      where: { id },
    });
  }

  // ==========================================
  // PRODUCT PRICING LOGIC
  // ==========================================

  async createPrice(productId: string, createPriceDto: CreateProductPriceDto) {
    const product = await this.findOne(productId);

    // Validate date logic
    const effectiveFrom = createPriceDto.effectivefrom ? new Date(createPriceDto.effectivefrom) : new Date();
    let effectiveTo: Date | null = null;
    if (createPriceDto.effectiveto) {
      effectiveTo = new Date(createPriceDto.effectiveto);
      if (effectiveTo <= effectiveFrom) {
        throw new BadRequestException('effectivefrom date must be before effectiveto date');
      }
    }

    // Determine if this should be the default price
    let isDefault = createPriceDto.isdefault || false;
    const existingPrices = await this.prisma.productPrice.findMany({
      where: { productid: productId },
    });

    if (existingPrices.length === 0) {
      isDefault = true; // First price must be default
    }

    if (isDefault) {
      // Set all other prices for this product to not default
      await this.prisma.productPrice.updateMany({
        where: { productid: productId },
        data: { isdefault: false },
      });
    }

    return this.prisma.productPrice.create({
      data: {
        productid: productId,
        price: createPriceDto.price,
        currency: createPriceDto.currency || 'USD',
        effectivefrom: effectiveFrom,
        effectiveto: effectiveTo,
        isdefault: isDefault,
      },
    });
  }

  async findAllPrices(productId: string) {
    await this.findOne(productId);
    return this.prisma.productPrice.findMany({
      where: { productid: productId },
      orderBy: { effectivefrom: 'desc' },
    });
  }

  async updatePrice(priceId: string, updatePriceDto: UpdateProductPriceDto) {
    const price = await this.prisma.productPrice.findUnique({
      where: { id: priceId },
    });
    if (!price) {
      throw new NotFoundException(`Product price with ID "${priceId}" not found`);
    }

    const effectiveFrom = updatePriceDto.effectivefrom ? new Date(updatePriceDto.effectivefrom) : new Date(price.effectivefrom);
    let effectiveTo = price.effectiveto;
    if (updatePriceDto.effectiveto) {
      effectiveTo = new Date(updatePriceDto.effectiveto);
      if (effectiveTo <= effectiveFrom) {
        throw new BadRequestException('effectivefrom date must be before effectiveto date');
      }
    }

    let isDefault = updatePriceDto.isdefault;
    if (isDefault) {
      await this.prisma.productPrice.updateMany({
        where: { productid: price.productid },
        data: { isdefault: false },
      });
    }

    return this.prisma.productPrice.update({
      where: { id: priceId },
      data: {
        price: updatePriceDto.price,
        currency: updatePriceDto.currency,
        effectivefrom: updatePriceDto.effectivefrom ? effectiveFrom : undefined,
        effectiveto: updatePriceDto.effectiveto ? effectiveTo : undefined,
        isdefault: isDefault,
      },
    });
  }

  async removePrice(priceId: string) {
    const price = await this.prisma.productPrice.findUnique({
      where: { id: priceId },
    });
    if (!price) {
      throw new NotFoundException(`Product price with ID "${priceId}" not found`);
    }

    if (price.isdefault) {
      // Check if other prices exist
      const otherPricesCount = await this.prisma.productPrice.count({
        where: {
          productid: price.productid,
          id: { not: priceId },
        },
      });

      if (otherPricesCount > 0) {
        throw new BadRequestException(
          'Cannot delete default price when other prices exist. Please set another price as default first.',
        );
      }
    }

    return this.prisma.productPrice.delete({
      where: { id: priceId },
    });
  }

  // ==========================================
  // HELPERS
  // ==========================================

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

