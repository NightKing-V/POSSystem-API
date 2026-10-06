export class AddSystemRolePermissionsCommand {
  constructor(
    public readonly roleId: string,
    public readonly permissionIds: string[],
  ) {}
}
