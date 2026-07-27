import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BrandsService {
  constructor(private prisma: PrismaService) {}

  async create(createBrandDto: CreateBrandDto) {
    return this.prisma.brand.create({
      data: {
        name: createBrandDto.name,
      },
    });
  }

  async findAll() {
    return this.prisma.brand.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
    if (!brand) {
      throw new NotFoundException(`Brand with ID "${id}" not found`);
    }
    return brand;
  }

  async update(id: string, updateBrandDto: UpdateBrandDto) {
    // Check if brand exists
    await this.findOne(id);

    return this.prisma.brand.update({
      where: { id },
      data: {
        name: updateBrandDto.name,
      },
    });
  }

  async remove(id: string) {
    const brand = await this.findOne(id);

    if (brand._count.products > 0) {
      throw new BadRequestException(
        `Cannot delete brand with ID "${id}" because it has ${brand._count.products} associated product(s).`,
      );
    }

    return this.prisma.brand.delete({
      where: { id },
    });
  }
}

