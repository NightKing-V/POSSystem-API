import { GetPermissionsQueryDto } from '../../roles/dto/get-permissions-query.dto';

export class GetPermissionsQuery {
  constructor(public readonly queryDto: GetPermissionsQueryDto = {}) {}
}
