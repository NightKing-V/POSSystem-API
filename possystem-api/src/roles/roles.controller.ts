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
  BadRequestException,
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
import { AssignRoleDto } from './dto/assign-role.dto';
import { ModifyRolePermissionsDto } from './dto/role-permissions.dto';
import { GetPermissionsQueryDto } from './dto/get-permissions-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Organization Roles & Memberships')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(JwtAuthGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  // ==========================================
  // 1. ORGANIZATION ROLES CRUD (/roles & /roles/org)
  // ==========================================

  @Post(['', 'org'])
  @ApiOperation({
    summary: 'Create a custom organization role (OrgRole)',
    description:
      'Creates a role scoped to a specific organization (`org_id`) and attaches permissions.',
  })
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get(['', 'org'])
  @ApiOperation({
    summary: 'List organization roles (OrgRole)',
    description:
      'Returns organization-scoped roles with member and permission counts (`_count`). Does not inline the full permissions array.',
  })
  @ApiQuery({
    name: 'orgId',
    required: false,
    description: 'Filter roles by organization UUID',
  })
  findAll(@Query('orgId') orgId?: string) {
    return this.rolesService.findAll(orgId);
  }

  // ==========================================
  // 2. ORG ROLE PERMISSIONS (/roles/permissions?roleId=... & /roles/:roleId/permissions)
  // ==========================================

  @Get(['permissions', 'org/permissions'])
  @ApiOperation({
    summary:
      'List permissions assigned to an organization role via query param (?roleId=... or ?roleid=..., paginated)',
  })
  @ApiQuery({
    name: 'roleId',
    required: true,
    description: 'Organization Role UUID (also accepts lowercase `roleid`)',
  })
  getRolePermissionsByQuery(@Query() queryDto: GetPermissionsQueryDto) {
    const resolvedRoleId = queryDto.roleId || queryDto.roleid;
    if (!resolvedRoleId) {
      throw new BadRequestException(
        'Query parameter "roleId" (or "roleid") is required to fetch role permissions',
      );
    }
    return this.rolesService.getRolePermissions(resolvedRoleId, queryDto);
  }

  @Post(['permissions', 'org/permissions'])
  @ApiOperation({
    summary:
      'Attach one or more permissions to an organization role via query param (?roleId=... or ?roleid=...)',
  })
  addRolePermissionsByQuery(
    @Query('roleId') roleId: string | undefined,
    @Query('roleid') roleid: string | undefined,
    @Body() dto: ModifyRolePermissionsDto,
  ) {
    const resolvedRoleId = roleId || roleid;
    if (!resolvedRoleId) {
      throw new BadRequestException(
        'Query parameter "roleId" (or "roleid") is required',
      );
    }
    return this.rolesService.addRolePermissions(
      resolvedRoleId,
      dto.permissionIds,
    );
  }

  @Delete(['permissions/:permissionId', 'org/permissions/:permissionId'])
  @ApiOperation({
    summary:
      'Remove a permission from an organization role via query param (?roleId=... or ?roleid=...)',
  })
  removeRolePermissionByQuery(
    @Param('permissionId') permissionId: string,
    @Query('roleId') roleId?: string,
    @Query('roleid') roleid?: string,
  ) {
    const resolvedRoleId = roleId || roleid;
    if (!resolvedRoleId) {
      throw new BadRequestException(
        'Query parameter "roleId" (or "roleid") is required',
      );
    }
    return this.rolesService.removeRolePermission(resolvedRoleId, permissionId);
  }

  @Get([':roleId/permissions', 'org/:roleId/permissions'])
  @ApiOperation({
    summary: 'List permissions assigned to an organization role (paginated)',
  })
  getRolePermissions(
    @Param('roleId') roleId: string,
    @Query() queryDto: GetPermissionsQueryDto,
  ) {
    return this.rolesService.getRolePermissions(roleId, queryDto);
  }

  @Post([':roleId/permissions', 'org/:roleId/permissions'])
  @ApiOperation({
    summary: 'Attach one or more permissions to an organization role',
  })
  addRolePermissions(
    @Param('roleId') roleId: string,
    @Body() dto: ModifyRolePermissionsDto,
  ) {
    return this.rolesService.addRolePermissions(roleId, dto.permissionIds);
  }

  @Delete([
    ':roleId/permissions/:permissionId',
    'org/:roleId/permissions/:permissionId',
  ])
  @ApiOperation({
    summary: 'Remove a permission from an organization role',
  })
  removeRolePermission(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.rolesService.removeRolePermission(roleId, permissionId);
  }

  // ==========================================
  // 3. ORGANIZATION MEMBER ROLES & PERMISSIONS
  // ==========================================

  @Get(['user-roles/:orgId/:userId', 'org/user-roles/:orgId/:userId'])
  @ApiOperation({
    summary:
      'Get the organization membership and single assigned OrgRole for a user in an org',
  })
  getUserRole(@Param('orgId') orgId: string, @Param('userId') userId: string) {
    return this.rolesService.getUserRole(userId, orgId);
  }

  @Get([
    'user-permissions/:orgId/:userId',
    'org/user-permissions/:orgId/:userId',
  ])
  @ApiOperation({
    summary:
      'Get effective organization permissions for a specific user from their assigned OrgRole',
  })
  getUserPermissions(
    @Param('orgId') orgId: string,
    @Param('userId') userId: string,
  ) {
    return this.rolesService.getUserPermissions(userId, orgId);
  }

  @Get(['my-permissions/:orgId', 'org/my-permissions/:orgId'])
  @ApiOperation({
    summary:
      'Get effective organization permissions for the currently authenticated user from their assigned OrgRole',
  })
  getMyPermissions(
    @Param('orgId') orgId: string,
    @Request() req: { user: { userId: string; email: string } },
  ) {
    return this.rolesService.getUserPermissions(req.user.userId, orgId);
  }

  @Post(['assign/:orgId/:userId', 'org/assign/:orgId/:userId'])
  @ApiOperation({
    summary:
      'Assign or update the single organization role (OrgRole) for a member in an org',
  })
  assignRole(
    @Param('orgId') orgId: string,
    @Param('userId') userId: string,
    @Body() assignRoleDto: AssignRoleDto,
    @Request() req: { user: { userId: string; email: string } },
  ) {
    const assignerId = req.user.userId;
    return this.rolesService.assignRoleToUser(
      userId,
      orgId,
      assignRoleDto.roleId,
      assignerId,
    );
  }

  @Delete(['unassign/:orgId/:userId', 'org/unassign/:orgId/:userId'])
  @ApiOperation({
    summary: 'Remove a user membership and role from an organization',
  })
  unassignMember(
    @Param('orgId') orgId: string,
    @Param('userId') userId: string,
  ) {
    return this.rolesService.removeRoleFromUser(userId, orgId);
  }

  @Delete([
    'unassign/:orgId/:userId/:roleId',
    'org/unassign/:orgId/:userId/:roleId',
  ])
  @ApiOperation({
    summary:
      'Remove a user membership from an organization (validating roleId)',
  })
  unassignRole(
    @Param('orgId') orgId: string,
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.rolesService.removeRoleFromUser(userId, orgId, roleId);
  }

  // ==========================================
  // 4. SINGLE ORG ROLE OPERATIONS (/roles/:id & /roles/org/:id)
  // ==========================================

  @Get(['org/:id', ':id'])
  @ApiOperation({
    summary: 'Get a single organization role (OrgRole) by ID',
  })
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(['org/:id', ':id'])
  @ApiOperation({
    summary: 'Update an organization role (OrgRole) and its permissions',
  })
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(['org/:id', ':id'])
  @ApiOperation({
    summary: 'Delete an organization role (OrgRole)',
  })
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}

