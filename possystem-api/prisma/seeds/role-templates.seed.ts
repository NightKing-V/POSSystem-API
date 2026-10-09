export interface RoleTemplateSeedBlueprint {
  key: string;
  name: string;
  description: string;
  is_entrypoint: boolean;
  is_location_scoped: boolean;
  matchPermission: (perm: { resource: string; action: string }) => boolean;
}

export const ROLE_TEMPLATES_SEED: RoleTemplateSeedBlueprint[] = [
  {
    key: 'OWNER',
    name: 'Owner',
    description: 'Full organization owner with access to all organization resources',
    is_entrypoint: true,
    is_location_scoped: false,
    matchPermission: () => true,
  },
  {
    key: 'MANAGER',
    name: 'Manager',
    description: 'Branch and store operations manager',
    is_entrypoint: false,
    is_location_scoped: true,
    matchPermission: (perm) =>
      perm.resource !== 'orgs' && perm.resource !== 'roles',
  },
  {
    key: 'CASHIER',
    name: 'Cashier',
    description: 'Point of Sale cashier for billing, payments, and customer management',
    is_entrypoint: false,
    is_location_scoped: true,
    matchPermission: (perm) =>
      [
        'bills',
        'bill',
        'payments',
        'payment',
        'customers',
        'customer',
        'discounts',
        'discount',
        'products',
        'product',
      ].includes(perm.resource),
  },
  {
    key: 'INVENTORY_MANAGER',
    name: 'Inventory Manager',
    description: 'Inventory, stock, supplier, and purchase order management',
    is_entrypoint: false,
    is_location_scoped: true,
    matchPermission: (perm) =>
      [
        'inventory',
        'products',
        'product',
        'categories',
        'category',
        'brands',
        'brand',
        'purchase_orders',
        'purchase_order',
        'suppliers',
        'supplier',
        'locations',
        'location',
      ].includes(perm.resource),
  },
];
