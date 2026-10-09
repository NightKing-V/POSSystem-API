import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetRolesQuery } from './get-roles.query';
import { PrismaService } from '../../prisma/prisma.service';

@QueryHandler(GetRolesQuery)
export class GetRolesHandler implements IQueryHandler<GetRolesQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetRolesQuery) {
    const { orgId } = query;
    return this.prisma.orgRole.findMany({
      where: orgId ? { org_id: orgId } : undefined,
      include: {
        _count: {
          select: {
            members: true,
            permissions: true,
          },
        },
      },
    });
  }
}

