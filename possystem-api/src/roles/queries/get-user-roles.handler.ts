import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserRolesQuery } from './get-user-roles.query';
import { PrismaService } from '../../prisma/prisma.service';

@QueryHandler(GetUserRolesQuery)
export class GetUserRolesHandler implements IQueryHandler<GetUserRolesQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetUserRolesQuery) {
    const { userId, orgId } = query;
    return this.prisma.userRole.findMany({
      where: {
        user_id: userId,
        org_id: orgId,
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });
  }
}
