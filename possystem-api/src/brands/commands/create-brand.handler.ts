import {
  CommandHandler,
  ICommandHandler,
} from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { CreateBrandCommand } from './create-brand.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(CreateBrandCommand)
export class CreateBrandHandler implements ICommandHandler<CreateBrandCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateBrandCommand) {
    const { createBrandDto } = command;

    const org = await this.prisma.org.findUnique({
      where: { id: createBrandDto.org_id },
    });

    if (!org) {
      throw new NotFoundException(
        `Organization with ID "${createBrandDto.org_id}" not found`,
      );
    }

    return this.prisma.brand.create({
      data: {
        org_id: createBrandDto.org_id,
        name: createBrandDto.name,
      },
    });
  }
}
