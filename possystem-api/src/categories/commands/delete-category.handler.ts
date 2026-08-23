import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DeleteCategoryCommand } from './delete-category.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(DeleteCategoryCommand)
export class DeleteCategoryHandler implements ICommandHandler<DeleteCategoryCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeleteCategoryCommand) {
    const { id } = command;

    const category = await this.prisma.productCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true, children: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

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
}
