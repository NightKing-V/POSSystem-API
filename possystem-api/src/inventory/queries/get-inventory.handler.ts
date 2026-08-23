import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { GetInventoryQuery } from './get-inventory.query';
import { PrismaService } from '../../prisma/prisma.service';

@QueryHandler(GetInventoryQuery)
export class GetInventoryHandler implements IQueryHandler<GetInventoryQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetInventoryQuery) {
    const { id } = query;
    const location = await this.prisma.inventoryLocation.findUnique({
      where: { id },
      include: {
        org: true,
        _count: {
          select: {
            user_locations: true,
            stocks: true,
            transactions: true,
            pos: true,
            bills: true,
          },
        },
      },
    });

    if (!location) {
      throw new NotFoundException(
        `Inventory location with ID "${id}" not found`,
      );
    }

    return location;
  }
}
