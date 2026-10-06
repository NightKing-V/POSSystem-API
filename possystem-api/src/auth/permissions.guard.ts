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

    const request = context.switchToHttp().getRequest();
    const { user } = request;
    if (!user || !user.userId) {
      throw new ForbiddenException('User not authenticated');
    }

    // Extract target organization context if present in params, query, or body
    const orgId: string | undefined =
      request.params?.orgId ||
      request.query?.orgId ||
      request.body?.org_id ||
      undefined;

    // 1. Fetch user's organization roles (filtered by orgId when available)
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        user_id: user.userId,
        ...(orgId ? { org_id: orgId } : {}),
      },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
      },
    });

    // 2. Also fetch any platform-level system roles assigned to the user
    const userSystemRoles = this.prisma.userSystemRole
      ? await this.prisma.userSystemRole.findMany({
          where: { user_id: user.userId },
          include: {
            system_role: {
              include: { permissions: { include: { permission: true } } },
            },
          },
        })
      : [];

    // 3. Flatten into a Set of strings like "action:resource" (e.g. "create:bills")
    const userPermissions = new Set<string>([
      ...userRoles.flatMap((ur) =>
        ur.role.permissions.map(
          (rp) => `${rp.permission.action}:${rp.permission.resource}`,
        ),
      ),
      ...userSystemRoles.flatMap((usr) =>
        usr.system_role.permissions.map(
          (srp) => `${srp.permission.action}:${srp.permission.resource}`,
        ),
      ),
    ]);

    // 4. Check if user has at least one of the required permissions (supporting wildcards)
    const hasPermission = requiredPermissions.some((reqPerm) => {
      if (userPermissions.has(reqPerm) || userPermissions.has('*:*')) {
        return true;
      }
      const [reqAction, reqResource] = reqPerm.split(':');
      return (
        userPermissions.has(`*:${reqResource}`) ||
        userPermissions.has(`${reqAction}:*`) ||
        userPermissions.has(`manage:${reqResource}`) ||
        userPermissions.has('manage:all')
      );
    });

    if (!hasPermission) {
      throw new ForbiddenException(
        'Insufficient permissions to access this resource',
      );
    }

    return true;
  }
}
