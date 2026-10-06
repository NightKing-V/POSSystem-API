export class RemoveOrgRolePermissionCommand {
  constructor(
    public readonly roleId: string,
    public readonly permissionId: string,
  ) {}
}
