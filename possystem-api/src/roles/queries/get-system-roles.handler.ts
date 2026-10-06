import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetSystemRolesQuery } from './get-system-roles.query';
import { PrismaService } from '../../prisma/prisma.service';

@QueryHandler(GetSystemRolesQuery)
export class GetSystemRolesHandler
  implements IQueryHandler<GetSystemRolesQuery>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetSystemRolesQuery) {
    const { isOrgTemplate } = query;
    return this.prisma.systemRole.findMany({
      where:
        isOrgTemplate !== undefined
          ? { is_org_template: isOrgTemplate }
          : undefined,
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }
}
