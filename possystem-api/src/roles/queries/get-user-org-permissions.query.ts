export class GetUserOrgPermissionsQuery {
  constructor(
    public readonly userId: string,
    public readonly orgId: string,
  ) {}
}
