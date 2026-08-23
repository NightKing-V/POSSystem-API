import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { GetUserLocationsQuery } from './get-user-locations.query';
import { PrismaService } from '../../prisma/prisma.service';

@QueryHandler(GetUserLocationsQuery)
export class GetUserLocationsHandler implements IQueryHandler<GetUserLocationsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetUserLocationsQuery) {
    const { userId } = query;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    return this.prisma.userLocation.findMany({
      where: { user_id: userId },
      include: {
        location: true,
      },
    });
  }
}
