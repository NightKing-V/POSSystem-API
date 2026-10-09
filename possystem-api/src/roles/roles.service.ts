import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { GetPermissionsQueryDto } from './dto/get-permissions-query.dto';
import { CreateRoleCommand } from './commands/create-role.command';
import { UpdateRoleCommand } from './commands/update-role.command';
import { DeleteRoleCommand } from './commands/delete-role.command';
import { AssignRoleCommand } from './commands/assign-role.command';
import { RemoveRoleCommand } from './commands/remove-role.command';
import { AddOrgRolePermissionsCommand } from './commands/add-org-role-permissions.command';
import { RemoveOrgRolePermissionCommand } from './commands/remove-org-role-permission.command';
import { GetRolesQuery } from './queries/get-roles.query';
import { GetRoleQuery } from './queries/get-role.query';
import { GetOrgRolePermissionsQuery } from './queries/get-org-role-permissions.query';
import { GetUserRolesQuery } from './queries/get-user-roles.query';
import { GetUserOrgPermissionsQuery } from './queries/get-user-org-permissions.query';

@Injectable()
export class RolesService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // ==========================================
  // ORG ROLES CRUD
  // ==========================================

  async create(createRoleDto: CreateRoleDto) {
    return this.commandBus.execute(new CreateRoleCommand(createRoleDto));
  }

  async findAll(orgId?: string) {
    return this.queryBus.execute(new GetRolesQuery(orgId));
  }

  async findOne(id: string) {
    return this.queryBus.execute(new GetRoleQuery(id));
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    return this.commandBus.execute(new UpdateRoleCommand(id, updateRoleDto));
  }

  async remove(id: string) {
    return this.commandBus.execute(new DeleteRoleCommand(id));
  }

  // ==========================================
  // ORG ROLE PERMISSIONS
  // ==========================================

  async getRolePermissions(
    roleId: string,
    queryDto: GetPermissionsQueryDto = {},
  ) {
    return this.queryBus.execute(
      new GetOrgRolePermissionsQuery(roleId, queryDto),
    );
  }

  async addRolePermissions(roleId: string, permissionIds: string[]) {
    return this.commandBus.execute(
      new AddOrgRolePermissionsCommand(roleId, permissionIds),
    );
  }

  async removeRolePermission(roleId: string, permissionId: string) {
    return this.commandBus.execute(
      new RemoveOrgRolePermissionCommand(roleId, permissionId),
    );
  }

  // ==========================================
  // ORG MEMBER ROLE ASSIGNMENT
  // ==========================================

  async assignRoleToUser(
    userId: string,
    orgId: string,
    roleId: string,
    assignerId: string,
  ) {
    return this.commandBus.execute(
      new AssignRoleCommand(userId, orgId, roleId, assignerId),
    );
  }

  async removeRoleFromUser(userId: string, orgId: string, roleId?: string) {
    return this.commandBus.execute(
      new RemoveRoleCommand(userId, orgId, roleId),
    );
  }

  async getUserRole(userId: string, orgId: string) {
    return this.queryBus.execute(new GetUserRolesQuery(userId, orgId));
  }

  async getUserPermissions(userId: string, orgId: string) {
    return this.queryBus.execute(new GetUserOrgPermissionsQuery(userId, orgId));
  }
}
