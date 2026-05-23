import { SetMetadata } from '@nestjs/common';

// Usage: @Permissions('create:bill', 'read:inventory')
export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);