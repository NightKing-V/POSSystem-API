import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    let level = 0;

    if (createCategoryDto.parent_id) {
      const parent = await this.prisma.productCategory.findUnique({
        where: { id: createCategoryDto.parent_id },
      });
      if (!parent) {
        throw new NotFoundException(
          `Parent category with ID "${createCategoryDto.parent_id}" not found`,
        );
      }
      level = parent.level + 1;
    }

    return this.prisma.productCategory.create({
      data: {
        name: createCategoryDto.name,
        parent_id: createCategoryDto.parent_id || null,
        level,
      },
    });
  }

  async findAll() {
    return this.prisma.productCategory.findMany({
      include: {
        children: true,
        _count: {
          select: { products: true, children: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.productCategory.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true, children: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findOne(id);
    let level = category.level;
    let parentId = updateCategoryDto.parent_id !== undefined ? updateCategoryDto.parent_id : category.parent_id;

    if (updateCategoryDto.parent_id) {
      // Prevent circular reference
      const isCircular = await this.detectCircularReference(id, updateCategoryDto.parent_id);
      if (isCircular) {
        throw new BadRequestException(
          `Cannot set parent category because it would create a circular dependency`,
        );
      }

      const parent = await this.prisma.productCategory.findUnique({
        where: { id: updateCategoryDto.parent_id },
      });
      if (!parent) {
        throw new NotFoundException(
          `Parent category with ID "${updateCategoryDto.parent_id}" not found`,
        );
      }
      level = parent.level + 1;
    } else if (updateCategoryDto.parent_id === null) {
      level = 0;
    }

    const updatedCategory = await this.prisma.productCategory.update({
      where: { id },
      data: {
        name: updateCategoryDto.name,
        parent_id: parentId,
        level,
      },
    });

    // If level has changed, recursively update level for all subcategories
    if (level !== category.level) {
      await this.updateChildrenLevels(id, level);
    }

    return updatedCategory;
  }

  async remove(id: string) {
    const category = await this.findOne(id);

    if (category._count.children > 0) {
      throw new BadRequestException(
        `Cannot delete category with ID "${id}" because it has ${category._count.children} subcategory/subcategories`,
      );
    }

    if (category._count.products > 0) {
      throw new BadRequestException(
        `Cannot delete category with ID "${id}" because it is linked to ${category._count.products} products`,
      );
    }

    return this.prisma.productCategory.delete({
      where: { id },
    });
  }

  private async detectCircularReference(categoryId: string, parentId: string): Promise<boolean> {
    if (categoryId === parentId) return true;
    let currentParentId: string | null = parentId;
    while (currentParentId) {
      const parent = await this.prisma.productCategory.findUnique({
        where: { id: currentParentId },
        select: { parent_id: true },
      });
      if (!parent) break;
      if (parent.parent_id === categoryId) return true;
      currentParentId = parent.parent_id;
    }
    return false;
  }

  private async updateChildrenLevels(parentId: string, parentLevel: number) {
    const children = await this.prisma.productCategory.findMany({
      where: { parent_id: parentId },
    });
    for (const child of children) {
      const nextLevel = parentLevel + 1;
      await this.prisma.productCategory.update({
        where: { id: child.id },
        data: { level: nextLevel },
      });
      await this.updateChildrenLevels(child.id, nextLevel);
    }
  }
}

