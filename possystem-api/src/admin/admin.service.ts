import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateSystemRoleDto } from './dto/create-system-role.dto';
import { UpdateSystemRoleDto } from './dto/update-system-role.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { GetPermissionsQueryDto } from '../roles/dto/get-permissions-query.dto';
import {
  CreateSystemRoleCommand,
  UpdateSystemRoleCommand,
  DeleteSystemRoleCommand,
  AssignSystemRoleCommand,
  RemoveSystemRoleCommand,
  AddSystemRolePermissionsCommand,
  RemoveSystemRolePermissionCommand,
  CreatePermissionCommand,
  DeletePermissionCommand,
} from './commands';
import {
  GetSystemRolesQuery,
  GetSystemRoleQuery,
  GetSystemRolePermissionsQuery,
  GetUserSystemRolesQuery,
  GetUserSystemPermissionsQuery,
  GetPermissionsQuery,
} from './queries';

@Injectable()
export class AdminService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // ==========================================
  // SYSTEM ROLES CRUD, PERMISSIONS & ASSIGNMENT
  // ==========================================

  async createSystemRole(createSystemRoleDto: CreateSystemRoleDto) {
    return this.commandBus.execute(
      new CreateSystemRoleCommand(createSystemRoleDto),
    );
  }

  async findAllSystemRoles() {
    return this.queryBus.execute(new GetSystemRolesQuery());
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
  // GLOBAL PERMISSIONS CRUD (PAGINATED)
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

