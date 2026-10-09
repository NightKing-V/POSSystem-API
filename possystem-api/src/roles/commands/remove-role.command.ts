export class RemoveRoleCommand {
  constructor(
    public readonly userId: string,
    public readonly orgId: string,
    public readonly roleId?: string,
  ) {}
}
