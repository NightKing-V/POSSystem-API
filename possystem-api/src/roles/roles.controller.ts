import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CreateSystemRoleDto } from './dto/create-system-role.dto';
import { UpdateSystemRoleDto } from './dto/update-system-role.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { ModifyRolePermissionsDto } from './dto/role-permissions.dto';
import { GetPermissionsQueryDto } from './dto/get-permissions-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Roles & Permissions')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(JwtAuthGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  // ==========================================
  // 1. ORGANIZATION ROLES & PERMISSIONS (/roles/org/*)
  // ==========================================

  @Post('org')
  @ApiOperation({
    summary: 'Create a custom organization role (OrgRole)',
    description:
      'Creates a role scoped to a specific organization (`org_id`) and attaches permissions.',
  })
  createOrgRole(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.createOrgRole(createRoleDto);
  }

  @Get('org')
  @ApiOperation({
    summary: 'List organization roles (OrgRole)',
    description:
      'Returns organization-scoped roles with their permissions and assignment counts. Optionally filter by `orgId`.',
  })
  @ApiQuery({
    name: 'orgId',
    required: false,
    description: 'Filter roles by organization UUID',
  })
  findAllOrgRoles(@Query('orgId') orgId?: string) {
    return this.rolesService.findAllOrgRoles(orgId);
  }

  @Get('org/user-roles/:orgId/:userId')
  @ApiOperation({
    summary: 'Get organization roles assigned to a user in a specific org',
  })
  getUserOrgRoles(
    @Param('orgId') orgId: string,
    @Param('userId') userId: string,
  ) {
    return this.rolesService.getUserOrgRoles(userId, orgId);
  }

  @Get('org/user-permissions/:orgId/:userId')
  @ApiOperation({
    summary:
      'Get deduplicated effective organization permissions for a user in an org',
  })
  getUserOrgPermissions(
    @Param('orgId') orgId: string,
    @Param('userId') userId: string,
  ) {
    return this.rolesService.getUserOrgPermissions(userId, orgId);
  }

  @Post('org/assign/:orgId/:userId')
  @ApiOperation({
    summary: 'Assign an organization role (OrgRole) to a user in an org',
  })
  assignOrgRole(
    @Param('orgId') orgId: string,
    @Param('userId') userId: string,
    @Body() assignRoleDto: AssignRoleDto,
    @Request() req: { user: { userId: string; email: string } },
  ) {
    const assignerId = req.user.userId;
    return this.rolesService.assignOrgRoleToUser(
      userId,
      orgId,
      assignRoleDto.roleId,
      assignerId,
    );
  }

  @Delete('org/unassign/:orgId/:userId/:roleId')
  @ApiOperation({
    summary: 'Unassign an organization role (OrgRole) from a user in an org',
  })
  unassignOrgRole(
    @Param('orgId') orgId: string,
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.rolesService.removeOrgRoleFromUser(userId, orgId, roleId);
  }

  @Get('org/:roleId/permissions')
  @ApiOperation({
    summary: 'List permissions assigned to an organization role (paginated)',
  })
  getOrgRolePermissions(
    @Param('roleId') roleId: string,
    @Query() queryDto: GetPermissionsQueryDto,
  ) {
    return this.rolesService.getOrgRolePermissions(roleId, queryDto);
  }

  @Post('org/:roleId/permissions')
  @ApiOperation({
    summary: 'Attach one or more permissions to an organization role',
  })
  addOrgRolePermissions(
    @Param('roleId') roleId: string,
    @Body() dto: ModifyRolePermissionsDto,
  ) {
    return this.rolesService.addOrgRolePermissions(roleId, dto.permissionIds);
  }

  @Delete('org/:roleId/permissions/:permissionId')
  @ApiOperation({
    summary: 'Remove a permission from an organization role',
  })
  removeOrgRolePermission(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.rolesService.removeOrgRolePermission(roleId, permissionId);
  }

  @Get('org/:id')
  @ApiOperation({
    summary: 'Get a single organization role (OrgRole) by ID',
  })
  findOneOrgRole(@Param('id') id: string) {
    return this.rolesService.findOneOrgRole(id);
  }

  @Patch('org/:id')
  @ApiOperation({
    summary: 'Update an organization role (OrgRole) and its permissions',
  })
  updateOrgRole(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.updateOrgRole(id, updateRoleDto);
  }

  @Delete('org/:id')
  @ApiOperation({
    summary: 'Delete an organization role (OrgRole)',
  })
  removeOrgRole(@Param('id') id: string) {
    return this.rolesService.removeOrgRole(id);
  }

  // ==========================================
  // 2. SYSTEM ROLES & PERMISSIONS (/roles/system/*)
  // ==========================================

  @Post('system')
  @ApiOperation({
    summary: 'Create a system role or org role template (SystemRole)',
    description:
      'Creates a platform-level system role (`is_org_template: false`) or an organization role template (`is_org_template: true`).',
  })
  createSystemRole(@Body() createSystemRoleDto: CreateSystemRoleDto) {
    return this.rolesService.createSystemRole(createSystemRoleDto);
  }

  @Get('system')
  @ApiOperation({
    summary: 'List system roles and/or org role templates (SystemRole)',
    description:
      'Returns `SystemRole` definitions with permissions. Filter with `?isOrgTemplate=true` for org templates (`OWNER`, `MANAGER`, `CASHIER`, `KITCHEN_STAFF`, `INVENTORY_CLERK`) or `?isOrgTemplate=false` for platform admin roles (`SYSTEM_ADMIN`).',
  })
  @ApiQuery({
    name: 'isOrgTemplate',
    required: false,
    type: Boolean,
    description:
      'Optional boolean filter (`true` for org role templates, `false` for platform system roles)',
  })
  findAllSystemRoles(@Query('isOrgTemplate') isOrgTemplate?: string) {
    const parsedFilter =
      isOrgTemplate === 'true'
        ? true
        : isOrgTemplate === 'false'
          ? false
          : undefined;
    return this.rolesService.findAllSystemRoles(parsedFilter);
  }

  @Get('system/user-roles/:userId')
  @ApiOperation({
    summary: 'Get platform-level system roles assigned to a user',
  })
  getUserSystemRoles(@Param('userId') userId: string) {
    return this.rolesService.getUserSystemRoles(userId);
  }

  @Get('system/user-permissions/:userId')
  @ApiOperation({
    summary:
      'Get deduplicated effective platform-level system permissions for a user',
  })
  getUserSystemPermissions(@Param('userId') userId: string) {
    return this.rolesService.getUserSystemPermissions(userId);
  }

  @Post('system/assign/:userId')
  @ApiOperation({
    summary: 'Assign a platform-level system role (SystemRole) to a user',
  })
  assignSystemRole(
    @Param('userId') userId: string,
    @Body() assignRoleDto: AssignRoleDto,
    @Request() req: { user: { userId: string; email: string } },
  ) {
    const assignerId = req.user.userId;
    return this.rolesService.assignSystemRoleToUser(
      userId,
      assignRoleDto.roleId,
      assignerId,
    );
  }

  @Delete('system/unassign/:userId/:roleId')
  @ApiOperation({
    summary: 'Unassign a platform-level system role (SystemRole) from a user',
  })
  unassignSystemRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.rolesService.removeSystemRoleFromUser(userId, roleId);
  }

  @Get('system/:roleId/permissions')
  @ApiOperation({
    summary: 'List permissions assigned to a system role (paginated)',
  })
  getSystemRolePermissions(
    @Param('roleId') roleId: string,
    @Query() queryDto: GetPermissionsQueryDto,
  ) {
    return this.rolesService.getSystemRolePermissions(roleId, queryDto);
  }

  @Post('system/:roleId/permissions')
  @ApiOperation({
    summary: 'Attach one or more permissions to a system role',
  })
  addSystemRolePermissions(
    @Param('roleId') roleId: string,
    @Body() dto: ModifyRolePermissionsDto,
  ) {
    return this.rolesService.addSystemRolePermissions(
      roleId,
      dto.permissionIds,
    );
  }

  @Delete('system/:roleId/permissions/:permissionId')
  @ApiOperation({
    summary: 'Remove a permission from a system role',
  })
  removeSystemRolePermission(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.rolesService.removeSystemRolePermission(roleId, permissionId);
  }

  @Get('system/:id')
  @ApiOperation({
    summary: 'Get a single system role (SystemRole) by ID',
  })
  findOneSystemRole(@Param('id') id: string) {
    return this.rolesService.findOneSystemRole(id);
  }

  @Patch('system/:id')
  @ApiOperation({
    summary: 'Update a system role (SystemRole) and its permissions',
  })
  updateSystemRole(
    @Param('id') id: string,
    @Body() updateSystemRoleDto: UpdateSystemRoleDto,
  ) {
    return this.rolesService.updateSystemRole(id, updateSystemRoleDto);
  }

  @Delete('system/:id')
  @ApiOperation({
    summary: 'Delete a system role (SystemRole)',
  })
  removeSystemRole(@Param('id') id: string) {
    return this.rolesService.removeSystemRole(id);
  }

  // ==========================================
  // 3. GLOBAL PERMISSIONS (/roles/permissions/*)
  // ==========================================

  @Post('permissions')
  @ApiOperation({
    summary: 'Create a global permission (resource + action)',
  })
  createPermission(@Body() createPermissionDto: CreatePermissionDto) {
    return this.rolesService.createPermission(createPermissionDto);
  }

  @Get('permissions')
  @ApiOperation({
    summary: 'List all global permissions (paginated & filterable)',
  })
  findAllPermissions(@Query() queryDto: GetPermissionsQueryDto) {
    return this.rolesService.findAllPermissions(queryDto);
  }

  @Get('permissions/all')
  @ApiOperation({
    summary: 'List all global permissions (paginated & filterable alias)',
  })
  findAllPermissionsAlias(@Query() queryDto: GetPermissionsQueryDto) {
    return this.rolesService.findAllPermissions(queryDto);
  }

  @Delete('permissions/:id')
  @ApiOperation({
    summary: 'Delete a global permission by ID',
  })
  removePermission(@Param('id') id: string) {
    return this.rolesService.removePermission(id);
  }
}


