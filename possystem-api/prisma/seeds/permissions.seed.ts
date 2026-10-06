export const PERMISSION_RESOURCES = [
  'orgs',
  'org',
  'users',
  'user',
  'roles',
  'role',
  'permissions',
  'permission',
  'products',
  'product',
  'categories',
  'category',
  'brands',
  'brand',
  'discounts',
  'discount',
  'inventory',
  'locations',
  'location',
  'suppliers',
  'supplier',
  'purchase_orders',
  'purchase_order',
  'customers',
  'customer',
  'loyalty',
  'bills',
  'bill',
  'payments',
  'payment',
  'all',
  '*',
] as const;

export const PERMISSION_ACTIONS = [
  'create',
  'read',
  'update',
  'delete',
  'manage',
  '*',
] as const;

export interface PermissionSeedItem {
  resource: string;
  action: string;
  description: string;
}

export function buildPermissionsSeedData(): PermissionSeedItem[] {
  const data: PermissionSeedItem[] = [];
  for (const resource of PERMISSION_RESOURCES) {
    for (const action of PERMISSION_ACTIONS) {
      data.push({
        resource,
        action,
        description: `Permission to ${action} ${resource}`,
      });
    }
  }
  return data;
}
