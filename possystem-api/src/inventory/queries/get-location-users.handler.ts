import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { GetLocationUsersQuery } from './get-location-users.query';
import { PrismaService } from '../../prisma/prisma.service';

@QueryHandler(GetLocationUsersQuery)
export class GetLocationUsersHandler implements IQueryHandler<GetLocationUsersQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetLocationUsersQuery) {
    const { locationId } = query;

    const location = await this.prisma.inventoryLocation.findUnique({
      where: { id: locationId },
    });
    if (!location) {
      throw new NotFoundException(
        `Inventory location with ID "${locationId}" not found`,
      );
    }

    return this.prisma.userLocation.findMany({
      where: { location_id: locationId },
      include: {
        user: true,
      },
    });
  }
}
