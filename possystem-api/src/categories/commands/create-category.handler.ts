import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryCommand } from './create-category.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(CreateCategoryCommand)
export class CreateCategoryHandler implements ICommandHandler<CreateCategoryCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateCategoryCommand) {
    const { createCategoryDto } = command;

    const org = await this.prisma.org.findUnique({
      where: { id: createCategoryDto.org_id },
    });
    if (!org) {
      throw new NotFoundException(
        `Organization with ID "${createCategoryDto.org_id}" not found`,
      );
    }

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
      if (parent.org_id !== createCategoryDto.org_id) {
        throw new BadRequestException(
          `Parent category with ID "${createCategoryDto.parent_id}" does not belong to organization "${createCategoryDto.org_id}"`,
        );
      }
      level = parent.level + 1;
    }

    const existing = await this.prisma.productCategory.findFirst({
      where: {
        org_id: createCategoryDto.org_id,
        parent_id: createCategoryDto.parent_id || null,
        name: createCategoryDto.name,
      },
    });
    if (existing) {
      throw new ConflictException(
        `Category "${createCategoryDto.name}" already exists at this level in this organization`,
      );
    }

    return this.prisma.productCategory.create({
      data: {
        org_id: createCategoryDto.org_id,
        name: createCategoryDto.name,
        parent_id: createCategoryDto.parent_id || null,
        level,
      },
    });
  }
}
