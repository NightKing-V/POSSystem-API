import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CreateSystemRoleDto } from './dto/create-system-role.dto';
import { UpdateSystemRoleDto } from './dto/update-system-role.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { GetPermissionsQueryDto } from './dto/get-permissions-query.dto';
import { CreateRoleCommand } from './commands/create-role.command';
import { UpdateRoleCommand } from './commands/update-role.command';
import { DeleteRoleCommand } from './commands/delete-role.command';
import { CreateSystemRoleCommand } from './commands/create-system-role.command';
import { UpdateSystemRoleCommand } from './commands/update-system-role.command';
import { DeleteSystemRoleCommand } from './commands/delete-system-role.command';
import { CreatePermissionCommand } from './commands/create-permission.command';
import { DeletePermissionCommand } from './commands/delete-permission.command';
import { AssignRoleCommand } from './commands/assign-role.command';
import { RemoveRoleCommand } from './commands/remove-role.command';
import { AssignSystemRoleCommand } from './commands/assign-system-role.command';
import { RemoveSystemRoleCommand } from './commands/remove-system-role.command';
import { AddOrgRolePermissionsCommand } from './commands/add-org-role-permissions.command';
import { RemoveOrgRolePermissionCommand } from './commands/remove-org-role-permission.command';
import { AddSystemRolePermissionsCommand } from './commands/add-system-role-permissions.command';
import { RemoveSystemRolePermissionCommand } from './commands/remove-system-role-permission.command';
import { GetRolesQuery } from './queries/get-roles.query';
import { GetRoleQuery } from './queries/get-role.query';
import { GetSystemRolesQuery } from './queries/get-system-roles.query';
import { GetSystemRoleQuery } from './queries/get-system-role.query';
import { GetPermissionsQuery } from './queries/get-permissions.query';
import { GetOrgRolePermissionsQuery } from './queries/get-org-role-permissions.query';
import { GetSystemRolePermissionsQuery } from './queries/get-system-role-permissions.query';
import { GetUserRolesQuery } from './queries/get-user-roles.query';
import { GetUserSystemRolesQuery } from './queries/get-user-system-roles.query';
import { GetUserOrgPermissionsQuery } from './queries/get-user-org-permissions.query';
import { GetUserSystemPermissionsQuery } from './queries/get-user-system-permissions.query';

@Injectable()
export class RolesService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // ==========================================
  // ORG ROLES CRUD, PERMISSIONS & ASSIGNMENT
  // ==========================================

  async createOrgRole(createRoleDto: CreateRoleDto) {
    return this.commandBus.execute(new CreateRoleCommand(createRoleDto));
  }

  async create(createRoleDto: CreateRoleDto) {
    return this.createOrgRole(createRoleDto);
  }

  async findAllOrgRoles(orgId?: string) {
    return this.queryBus.execute(new GetRolesQuery(orgId));
  }

  async findAll(orgId?: string) {
    return this.findAllOrgRoles(orgId);
  }

  async findOneOrgRole(id: string) {
    return this.queryBus.execute(new GetRoleQuery(id));
  }

  async findOne(id: string) {
    return this.findOneOrgRole(id);
  }

  async updateOrgRole(id: string, updateRoleDto: UpdateRoleDto) {
    return this.commandBus.execute(new UpdateRoleCommand(id, updateRoleDto));
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    return this.updateOrgRole(id, updateRoleDto);
  }

  async removeOrgRole(id: string) {
    return this.commandBus.execute(new DeleteRoleCommand(id));
  }

  async remove(id: string) {
    return this.removeOrgRole(id);
  }

  async getOrgRolePermissions(
    roleId: string,
    queryDto: GetPermissionsQueryDto = {},
  ) {
    return this.queryBus.execute(
      new GetOrgRolePermissionsQuery(roleId, queryDto),
    );
  }

  async addOrgRolePermissions(roleId: string, permissionIds: string[]) {
    return this.commandBus.execute(
      new AddOrgRolePermissionsCommand(roleId, permissionIds),
    );
  }

  async removeOrgRolePermission(roleId: string, permissionId: string) {
    return this.commandBus.execute(
      new RemoveOrgRolePermissionCommand(roleId, permissionId),
    );
  }

  async assignOrgRoleToUser(
    userId: string,
    orgId: string,
    roleId: string,
    assignerId: string,
  ) {
    return this.commandBus.execute(
      new AssignRoleCommand(userId, orgId, roleId, assignerId),
    );
  }

  async assignRoleToUser(
    userId: string,
    orgId: string,
    roleId: string,
    assignerId: string,
  ) {
    return this.assignOrgRoleToUser(userId, orgId, roleId, assignerId);
  }

  async removeOrgRoleFromUser(userId: string, orgId: string, roleId: string) {
    return this.commandBus.execute(
      new RemoveRoleCommand(userId, orgId, roleId),
    );
  }

  async removeRoleFromUser(userId: string, orgId: string, roleId: string) {
    return this.removeOrgRoleFromUser(userId, orgId, roleId);
  }

  async getUserOrgRoles(userId: string, orgId: string) {
    return this.queryBus.execute(new GetUserRolesQuery(userId, orgId));
  }

  async getUserRoles(userId: string, orgId: string) {
    return this.getUserOrgRoles(userId, orgId);
  }

  async getUserOrgPermissions(userId: string, orgId: string) {
    return this.queryBus.execute(new GetUserOrgPermissionsQuery(userId, orgId));
  }

  // ==========================================
  // SYSTEM ROLES CRUD, PERMISSIONS & ASSIGNMENT
  // ==========================================

  async createSystemRole(createSystemRoleDto: CreateSystemRoleDto) {
    return this.commandBus.execute(
      new CreateSystemRoleCommand(createSystemRoleDto),
    );
  }

  async findAllSystemRoles(isOrgTemplate?: boolean) {
    return this.queryBus.execute(new GetSystemRolesQuery(isOrgTemplate));
  }

  async findOneSystemRole(id: string) {
    return this.queryBus.execute(new GetSystemRoleQuery(id));
  }

  async updateSystemRole(id: string, updateSystemRoleDto: UpdateSystemRoleDto) {
    return this.commandBus.execute(
      new UpdateSystemRoleCommand(id, updateSystemRoleDto),
    );
  }

  async removeSystemRole(id: string) {
    return this.commandBus.execute(new DeleteSystemRoleCommand(id));
  }

  async getSystemRolePermissions(
    roleId: string,
    queryDto: GetPermissionsQueryDto = {},
  ) {
    return this.queryBus.execute(
      new GetSystemRolePermissionsQuery(roleId, queryDto),
    );
  }

  async addSystemRolePermissions(roleId: string, permissionIds: string[]) {
    return this.commandBus.execute(
      new AddSystemRolePermissionsCommand(roleId, permissionIds),
    );
  }

  async removeSystemRolePermission(roleId: string, permissionId: string) {
    return this.commandBus.execute(
      new RemoveSystemRolePermissionCommand(roleId, permissionId),
    );
  }

  async assignSystemRoleToUser(
    userId: string,
    roleId: string,
    assignerId: string,
  ) {
    return this.commandBus.execute(
      new AssignSystemRoleCommand(userId, roleId, assignerId),
    );
  }

  async removeSystemRoleFromUser(userId: string, roleId: string) {
    return this.commandBus.execute(new RemoveSystemRoleCommand(userId, roleId));
  }

  async getUserSystemRoles(userId: string) {
    return this.queryBus.execute(new GetUserSystemRolesQuery(userId));
  }

  async getUserSystemPermissions(userId: string) {
    return this.queryBus.execute(new GetUserSystemPermissionsQuery(userId));
  }

  // ==========================================
  // PERMISSIONS CRUD (PAGINATED)
  // ==========================================

  async createPermission(createPermissionDto: CreatePermissionDto) {
    return this.commandBus.execute(
      new CreatePermissionCommand(createPermissionDto),
    );
  }

  async findAllPermissions(queryDto: GetPermissionsQueryDto = {}) {
    return this.queryBus.execute(new GetPermissionsQuery(queryDto));
  }

  async removePermission(id: string) {
    return this.commandBus.execute(new DeletePermissionCommand(id));
  }
}


