import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { CreateCategoryCommand } from './create-category.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(CreateCategoryCommand)
export class CreateCategoryHandler implements ICommandHandler<CreateCategoryCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateCategoryCommand) {
    const { createCategoryDto } = command;
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
}
