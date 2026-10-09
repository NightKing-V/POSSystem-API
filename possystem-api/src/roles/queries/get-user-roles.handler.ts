import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { GetUserRolesQuery } from './get-user-roles.query';
import { PrismaService } from '../../prisma/prisma.service';

@QueryHandler(GetUserRolesQuery)
export class GetUserRolesHandler implements IQueryHandler<GetUserRolesQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetUserRolesQuery) {
    const { userId, orgId } = query;
    const membership = await this.prisma.orgMember.findUnique({
      where: {
        user_id_org_id: {
          user_id: userId,
          org_id: orgId,
        },
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

    if (!membership) {
      throw new NotFoundException(
        `User "${userId}" is not a member of organization "${orgId}"`,
      );
    }

    return membership;
  }
}
