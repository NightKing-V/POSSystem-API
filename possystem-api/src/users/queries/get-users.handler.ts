import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUsersQuery } from './get-users.query';
import { PrismaService } from '../../prisma/prisma.service';

@QueryHandler(GetUsersQuery)
export class GetUsersHandler implements IQueryHandler<GetUsersQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetUsersQuery) {
    const { orgId } = query;
    return this.prisma.user.findMany({
      where: orgId
        ? {
            OR: [
              { owned_orgs: { some: { id: orgId } } },
              { roles: { some: { org_id: orgId } } },
            ],
          }
        : undefined,
    });
  }
}
