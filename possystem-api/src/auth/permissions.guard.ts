import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { PERMISSIONS_KEY } from './permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true; // No specific permissions required
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.userId) {
      throw new ForbiddenException('User not authenticated');
    }

    // 1. Fetch user roles and their associated permissions from the database
    const userRoles = await this.prisma.userRole.findMany({
      where: { user_id: user.userId },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
      },
    });

    // 2. Flatten into an array of strings like "action:resource" (e.g. "create:bills")
    const userPermissions = userRoles.flatMap((ur) =>
      ur.role.permissions.map(
        (rp) => `${rp.permission.action}:${rp.permission.resource}`,
      ),
    );

    // 3. Check if user has at least one of the required permissions
    const hasPermission = requiredPermissions.some((perm) =>
      userPermissions.includes(perm),
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        'Insufficient permissions to access this resource',
      );
    }

    return true;
  }
}
