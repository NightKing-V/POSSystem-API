/**
 * Canonical Application Resources
 */
export const AppResource = {
  ORGS: 'orgs',
  USERS: 'users',
  ROLES: 'roles',
  PERMISSIONS: 'permissions',
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  BRANDS: 'brands',
  DISCOUNTS: 'discounts',
  INVENTORY: 'inventory',
  LOCATIONS: 'locations',
  SUPPLIERS: 'suppliers',
  PURCHASE_ORDERS: 'purchase_orders',
  CUSTOMERS: 'customers',
  LOYALTY: 'loyalty',
  BILLS: 'bills',
  PAYMENTS: 'payments',
  ALL: '*',
} as const;

export type AppResourceType = (typeof AppResource)[keyof typeof AppResource];

/**
 * Canonical Application Actions
 */
export const AppAction = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage',
  ALL: '*',
} as const;

export type AppActionType = (typeof AppAction)[keyof typeof AppAction];

/**
 * Fixed list of all permission names in `action:resource` format for Guards and @Permissions() decorator
 */
export const PERMISSIONS = {
  // Global / Wildcard
  ALL: '*:*',
  MANAGE_ALL: 'manage:all',

  // Organizations
  ORGS_CREATE: 'create:orgs',
  ORGS_READ: 'read:orgs',
  ORGS_UPDATE: 'update:orgs',
  ORGS_DELETE: 'delete:orgs',
  ORGS_MANAGE: 'manage:orgs',

  // Users
  USERS_CREATE: 'create:users',
  USERS_READ: 'read:users',
  USERS_UPDATE: 'update:users',
  USERS_DELETE: 'delete:users',
  USERS_MANAGE: 'manage:users',

  // Roles & Permissions
  ROLES_CREATE: 'create:roles',
  ROLES_READ: 'read:roles',
  ROLES_UPDATE: 'update:roles',
  ROLES_DELETE: 'delete:roles',
  ROLES_MANAGE: 'manage:roles',

  PERMISSIONS_READ: 'read:permissions',
  PERMISSIONS_MANAGE: 'manage:permissions',

  // Products
  PRODUCTS_CREATE: 'create:products',
  PRODUCTS_READ: 'read:products',
  PRODUCTS_UPDATE: 'update:products',
  PRODUCTS_DELETE: 'delete:products',
  PRODUCTS_MANAGE: 'manage:products',

  // Categories & Brands
  CATEGORIES_CREATE: 'create:categories',
  CATEGORIES_READ: 'read:categories',
  CATEGORIES_UPDATE: 'update:categories',
  CATEGORIES_DELETE: 'delete:categories',
  CATEGORIES_MANAGE: 'manage:categories',

  BRANDS_CREATE: 'create:brands',
  BRANDS_READ: 'read:brands',
  BRANDS_UPDATE: 'update:brands',
  BRANDS_DELETE: 'delete:brands',
  BRANDS_MANAGE: 'manage:brands',

  // Inventory & Locations
  INVENTORY_CREATE: 'create:inventory',
  INVENTORY_READ: 'read:inventory',
  INVENTORY_UPDATE: 'update:inventory',
  INVENTORY_DELETE: 'delete:inventory',
  INVENTORY_MANAGE: 'manage:inventory',

  LOCATIONS_CREATE: 'create:locations',
  LOCATIONS_READ: 'read:locations',
  LOCATIONS_UPDATE: 'update:locations',
  LOCATIONS_DELETE: 'delete:locations',
  LOCATIONS_MANAGE: 'manage:locations',

  // Suppliers & Purchase Orders
  SUPPLIERS_CREATE: 'create:suppliers',
  SUPPLIERS_READ: 'read:suppliers',
  SUPPLIERS_UPDATE: 'update:suppliers',
  SUPPLIERS_DELETE: 'delete:suppliers',
  SUPPLIERS_MANAGE: 'manage:suppliers',

  PURCHASE_ORDERS_CREATE: 'create:purchase_orders',
  PURCHASE_ORDERS_READ: 'read:purchase_orders',
  PURCHASE_ORDERS_UPDATE: 'update:purchase_orders',
  PURCHASE_ORDERS_DELETE: 'delete:purchase_orders',
  PURCHASE_ORDERS_MANAGE: 'manage:purchase_orders',

  // Customers & Loyalty
  CUSTOMERS_CREATE: 'create:customers',
  CUSTOMERS_READ: 'read:customers',
  CUSTOMERS_UPDATE: 'update:customers',
  CUSTOMERS_DELETE: 'delete:customers',
  CUSTOMERS_MANAGE: 'manage:customers',

  LOYALTY_CREATE: 'create:loyalty',
  LOYALTY_READ: 'read:loyalty',
  LOYALTY_UPDATE: 'update:loyalty',
  LOYALTY_DELETE: 'delete:loyalty',
  LOYALTY_MANAGE: 'manage:loyalty',

  // Discounts
  DISCOUNTS_CREATE: 'create:discounts',
  DISCOUNTS_READ: 'read:discounts',
  DISCOUNTS_UPDATE: 'update:discounts',
  DISCOUNTS_DELETE: 'delete:discounts',
  DISCOUNTS_MANAGE: 'manage:discounts',

  // Billing & Payments
  BILLS_CREATE: 'create:bills',
  BILLS_READ: 'read:bills',
  BILLS_UPDATE: 'update:bills',
  BILLS_DELETE: 'delete:bills',
  BILLS_MANAGE: 'manage:bills',

  PAYMENTS_CREATE: 'create:payments',
  PAYMENTS_READ: 'read:payments',
  PAYMENTS_UPDATE: 'update:payments',
  PAYMENTS_DELETE: 'delete:payments',
  PAYMENTS_MANAGE: 'manage:payments',
} as const;

export type PermissionString = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Array of all defined permission string constants
 */
export const ALL_PERMISSIONS_LIST: PermissionString[] = Object.values(PERMISSIONS);
