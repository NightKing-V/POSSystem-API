import { GetPermissionsQueryDto } from '../dto/get-permissions-query.dto';

export class GetPermissionsQuery {
  constructor(public readonly queryDto: GetPermissionsQueryDto = {}) {}
}
