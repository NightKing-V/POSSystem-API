export interface SystemRoleSeedBlueprint {
  key: string;
  name: string;
  description: string;
  is_org_template: boolean;
  is_org_entrypoint: boolean;
  is_location_scoped: boolean;
  matchPermission: (perm: { resource: string; action: string }) => boolean;
}

const MANAGER_FULL_RESOURCES = new Set([
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
]);

const MANAGER_READ_RESOURCES = new Set([
  'orgs',
  'org',
  'users',
  'user',
  'roles',
  'role',
]);

const CASHIER_READ_RESOURCES = new Set([
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
  'customers',
  'customer',
  'loyalty',
]);

const CASHIER_WRITE_RESOURCES = new Set([
  'customers',
  'customer',
  'loyalty',
  'bills',
  'bill',
  'payments',
  'payment',
]);

export const SYSTEM_ROLES_SEED: SystemRoleSeedBlueprint[] = [
  {
    key: 'SYSTEM_ADMIN',
    name: 'System Admin',
    description: 'Platform-wide System Administrator (Non-Organization Role)',
    is_org_template: false,
    is_org_entrypoint: false,
    is_location_scoped: false,
    matchPermission: () => true,
  },
  {
    key: 'OWNER',
    name: 'Owner',
    description: 'Organization Owner with full organization access',
    is_org_template: true,
    is_org_entrypoint: true,
    is_location_scoped: false,
    matchPermission: () => true,
  },
  {
    key: 'MANAGER',
    name: 'Manager',
    description: 'Location Manager overseeing catalog, inventory, suppliers, and sales',
    is_org_template: true,
    is_org_entrypoint: false,
    is_location_scoped: true,
    matchPermission: ({ resource, action }) =>
      MANAGER_FULL_RESOURCES.has(resource) ||
      (MANAGER_READ_RESOURCES.has(resource) && action === 'read'),
  },
  {
    key: 'CASHIER',
    name: 'Cashier',
    description: 'Location Cashier handling POS checkout, bills, and customers',
    is_org_template: true,
    is_org_entrypoint: false,
    is_location_scoped: true,
    matchPermission: ({ resource, action }) =>
      (CASHIER_READ_RESOURCES.has(resource) && action === 'read') ||
      (CASHIER_WRITE_RESOURCES.has(resource) &&
        ['create', 'read', 'update'].includes(action)),
  },
];
