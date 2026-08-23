import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UpdateCategoryCommand } from './update-category.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(UpdateCategoryCommand)
export class UpdateCategoryHandler implements ICommandHandler<UpdateCategoryCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateCategoryCommand) {
    const { id, updateCategoryDto } = command;

    const category = await this.prisma.productCategory.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    let level = category.level;
    let parentId =
      updateCategoryDto.parent_id !== undefined
        ? updateCategoryDto.parent_id
        : category.parent_id;

    if (updateCategoryDto.parent_id) {
      const isCircular = await this.detectCircularReference(
        id,
        updateCategoryDto.parent_id,
      );
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

    if (level !== category.level) {
      await this.updateChildrenLevels(id, level);
    }

    return updatedCategory;
  }

  private async detectCircularReference(
    categoryId: string,
    parentId: string,
  ): Promise<boolean> {
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
