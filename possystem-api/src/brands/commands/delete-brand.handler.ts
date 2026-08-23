import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DeleteBrandCommand } from './delete-brand.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(DeleteBrandCommand)
export class DeleteBrandHandler implements ICommandHandler<DeleteBrandCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeleteBrandCommand) {
    const { id } = command;

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
