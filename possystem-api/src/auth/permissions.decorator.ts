import { SetMetadata } from '@nestjs/common';
import { PermissionString } from '../common/constants/permissions.constant';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to require specific permissions on controllers or route handlers.
 * Usage: `@Permissions(PERMISSIONS.BILLS_CREATE, PERMISSIONS.INVENTORY_READ)`
 */
export const Permissions = (...permissions: (PermissionString | string)[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export * from '../common/constants/permissions.constant';
