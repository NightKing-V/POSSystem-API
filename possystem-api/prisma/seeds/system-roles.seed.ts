export interface SystemRoleSeedBlueprint {
  key: string;
  name: string;
  description: string;
  matchPermission: (perm: { resource: string; action: string }) => boolean;
}

export const SYSTEM_ROLES_SEED: SystemRoleSeedBlueprint[] = [
  {
    key: 'SYSTEM_ADMIN',
    name: 'System Admin',
    description: 'Platform-wide System Administrator',
    matchPermission: () => true,
  },
];

