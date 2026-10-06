import { GetPermissionsQueryDto } from '../dto/get-permissions-query.dto';

export class GetOrgRolePermissionsQuery {
  constructor(
    public readonly roleId: string,
    public readonly queryDto: GetPermissionsQueryDto = {},
  ) {}
}
