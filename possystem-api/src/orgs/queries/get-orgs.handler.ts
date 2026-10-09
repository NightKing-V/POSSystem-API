import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetOrgsQuery } from './get-orgs.query';
import { PrismaService } from '../../prisma/prisma.service';

@QueryHandler(GetOrgsQuery)
export class GetOrgsHandler implements IQueryHandler<GetOrgsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetOrgsQuery) {
    const { userId } = query;
    return this.prisma.org.findMany({
      where: userId
        ? {
            OR: [
              { owner_id: userId },
              { members: { some: { user_id: userId } } },
            ],
          }
        : undefined,
      include: {
        business_category: true,
        owner: true,
        locations: true,
      },
    });
  }
}
