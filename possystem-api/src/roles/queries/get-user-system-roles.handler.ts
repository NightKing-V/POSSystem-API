import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserSystemRolesQuery } from './get-user-system-roles.query';
import { PrismaService } from '../../prisma/prisma.service';

@QueryHandler(GetUserSystemRolesQuery)
export class GetUserSystemRolesHandler
  implements IQueryHandler<GetUserSystemRolesQuery>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetUserSystemRolesQuery) {
    const { userId } = query;
    return this.prisma.userSystemRole.findMany({
      where: {
        user_id: userId,
      },
      include: {
        system_role: {
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
