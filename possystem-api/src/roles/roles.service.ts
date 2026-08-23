import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { CreateRoleCommand } from './commands/create-role.command';
import { UpdateRoleCommand } from './commands/update-role.command';
import { DeleteRoleCommand } from './commands/delete-role.command';
import { CreatePermissionCommand } from './commands/create-permission.command';
import { DeletePermissionCommand } from './commands/delete-permission.command';
import { AssignRoleCommand } from './commands/assign-role.command';
import { RemoveRoleCommand } from './commands/remove-role.command';
import { GetRolesQuery } from './queries/get-roles.query';
import { GetRoleQuery } from './queries/get-role.query';
import { GetPermissionsQuery } from './queries/get-permissions.query';
import { GetUserRolesQuery } from './queries/get-user-roles.query';

@Injectable()
export class RolesService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // ==========================================
  // ROLES CRUD
  // ==========================================

  async create(createRoleDto: CreateRoleDto) {
    return this.commandBus.execute(new CreateRoleCommand(createRoleDto));
  }

  async findAll() {
    return this.queryBus.execute(new GetRolesQuery());
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
  // PERMISSIONS CRUD
  // ==========================================

  async createPermission(createPermissionDto: CreatePermissionDto) {
    return this.commandBus.execute(
      new CreatePermissionCommand(createPermissionDto),
    );
  }

  async findAllPermissions() {
    return this.queryBus.execute(new GetPermissionsQuery());
  }

  async removePermission(id: string) {
    return this.commandBus.execute(new DeletePermissionCommand(id));
  }

  // ==========================================
  // USER ROLES ASSIGNMENT
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

  async removeRoleFromUser(userId: string, orgId: string, roleId: string) {
    return this.commandBus.execute(
      new RemoveRoleCommand(userId, orgId, roleId),
    );
  }

  async getUserRoles(userId: string, orgId: string) {
    return this.queryBus.execute(new GetUserRolesQuery(userId, orgId));
  }
}
