import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async create(createSupplierDto: CreateSupplierDto) {
    // Verify Org exists
    const org = await this.prisma.org.findUnique({
      where: { id: createSupplierDto.org_id },
    });
    if (!org) {
      throw new NotFoundException(`Organization with ID "${createSupplierDto.org_id}" not found`);
    }

    return this.prisma.supplier.create({
      data: {
        org_id: createSupplierDto.org_id,
        name: createSupplierDto.name,
        contact_person: createSupplierDto.contact_person || null,
        phone: createSupplierDto.phone || null,
        email: createSupplierDto.email || null,
        address: createSupplierDto.address || null,
        business_reg_no: createSupplierDto.business_reg_no || null,
        description: createSupplierDto.description || null,
      },
    });
  }

  async findAll(orgId?: string) {
    return this.prisma.supplier.findMany({
      where: orgId ? { org_id: orgId } : undefined,
      include: {
        _count: {
          select: { products: true, batches: true, purchase_orders: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true, batches: true, purchase_orders: true },
        },
      },
    });
    if (!supplier) {
      throw new NotFoundException(`Supplier with ID "${id}" not found`);
    }
    return supplier;
  }

  async update(id: string, updateSupplierDto: UpdateSupplierDto) {
    await this.findOne(id);

    return this.prisma.supplier.update({
      where: { id },
      data: {
        name: updateSupplierDto.name,
        contact_person: updateSupplierDto.contact_person,
        phone: updateSupplierDto.phone,
        email: updateSupplierDto.email,
        address: updateSupplierDto.address,
        business_reg_no: updateSupplierDto.business_reg_no,
        description: updateSupplierDto.description,
      },
    });
  }

  async remove(id: string) {
    const supplier = await this.findOne(id);

    if (supplier._count.products > 0) {
      throw new BadRequestException(
        `Cannot delete supplier with ID "${id}" because they are linked to ${supplier._count.products} products.`,
      );
    }

    if (supplier._count.batches > 0) {
      throw new BadRequestException(
        `Cannot delete supplier with ID "${id}" because they are linked to ${supplier._count.batches} stock batches.`,
      );
    }

    if (supplier._count.purchase_orders > 0) {
      throw new BadRequestException(
        `Cannot delete supplier with ID "${id}" because they are linked to ${supplier._count.purchase_orders} purchase orders.`,
      );
    }

    return this.prisma.supplier.delete({
      where: { id },
    });
  }

  async findProducts(id: string) {
    await this.findOne(id);
    return this.prisma.product.findMany({
      where: { supplier_id: id },
      include: {
        category: true,
        brand: true,
      },
    });
  }
}

