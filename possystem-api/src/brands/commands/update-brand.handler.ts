import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UpdateBrandCommand } from './update-brand.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(UpdateBrandCommand)
export class UpdateBrandHandler implements ICommandHandler<UpdateBrandCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateBrandCommand) {
    const { id, updateBrandDto } = command;

    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) {
      throw new NotFoundException(`Brand with ID "${id}" not found`);
    }

    if (updateBrandDto.name && updateBrandDto.name !== brand.name) {
      const existing = await this.prisma.brand.findUnique({
        where: {
          org_id_name: {
            org_id: brand.org_id,
            name: updateBrandDto.name,
          },
        },
      });
      if (existing) {
        throw new ConflictException(
          `Brand "${updateBrandDto.name}" already exists in this organization`,
        );
      }
    }

    return this.prisma.brand.update({
      where: { id },
      data: {
        name: updateBrandDto.name,
      },
    });
  }
}
