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
import { AdminService } from './admin.service';
import { CreateSystemRoleDto } from './dto/create-system-role.dto';
import { UpdateSystemRoleDto } from './dto/update-system-role.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { AssignRoleDto } from '../roles/dto/assign-role.dto';
import { ModifyRolePermissionsDto } from '../roles/dto/role-permissions.dto';
import { GetPermissionsQueryDto } from '../roles/dto/get-permissions-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Admin — System Roles & Global Permissions')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ==========================================
  // 1. SYSTEM ROLES (/admin/system-roles/*)
  // ==========================================

  @Post('system-roles')
  @ApiOperation({
    summary: 'Create a platform-level system role (SystemRole)',
  })
  createSystemRole(@Body() createSystemRoleDto: CreateSystemRoleDto) {
    return this.adminService.createSystemRole(createSystemRoleDto);
  }

  @Get('system-roles')
  @ApiOperation({
    summary: 'List platform-level system roles (SystemRole)',
  })
  findAllSystemRoles() {
    return this.adminService.findAllSystemRoles();
  }

  @Get('system-roles/permissions')
  @ApiOperation({
    summary:
      'List permissions assigned to a system role via query param (?roleId=... or ?roleid=..., paginated)',
  })
  @ApiQuery({
    name: 'roleId',
    required: true,
    description: 'System Role UUID (also accepts lowercase `roleid`)',
  })
  getSystemRolePermissionsByQuery(@Query() queryDto: GetPermissionsQueryDto) {
    const resolvedRoleId = queryDto.roleId || queryDto.roleid;
    if (!resolvedRoleId) {
      throw new BadRequestException(
        'Query parameter "roleId" (or "roleid") is required to fetch system role permissions',
      );
    }
    return this.adminService.getSystemRolePermissions(resolvedRoleId, queryDto);
  }

  @Get('system-roles/user-roles/:userId')
  @ApiOperation({
    summary: 'Get platform-level system roles assigned to a user',
  })
  getUserSystemRoles(@Param('userId') userId: string) {
    return this.adminService.getUserSystemRoles(userId);
  }

  @Get('system-roles/user-permissions/:userId')
  @ApiOperation({
    summary:
      'Get deduplicated effective platform-level system permissions for a user',
  })
  getUserSystemPermissions(@Param('userId') userId: string) {
    return this.adminService.getUserSystemPermissions(userId);
  }

  @Post('system-roles/assign/:userId')
  @ApiOperation({
    summary: 'Assign a platform-level system role (SystemRole) to a user',
  })
  assignSystemRole(
    @Param('userId') userId: string,
    @Body() assignRoleDto: AssignRoleDto,
    @Request() req: { user: { userId: string; email: string } },
  ) {
    const assignerId = req.user.userId;
    return this.adminService.assignSystemRoleToUser(
      userId,
      assignRoleDto.roleId,
      assignerId,
    );
  }

  @Delete('system-roles/unassign/:userId/:roleId')
  @ApiOperation({
    summary: 'Unassign a platform-level system role (SystemRole) from a user',
  })
  unassignSystemRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.adminService.removeSystemRoleFromUser(userId, roleId);
  }

  @Get('system-roles/:roleId/permissions')
  @ApiOperation({
    summary: 'List permissions assigned to a system role (paginated)',
  })
  getSystemRolePermissions(
    @Param('roleId') roleId: string,
    @Query() queryDto: GetPermissionsQueryDto,
  ) {
    return this.adminService.getSystemRolePermissions(roleId, queryDto);
  }

  @Post('system-roles/:roleId/permissions')
  @ApiOperation({
    summary: 'Attach one or more permissions to a system role',
  })
  addSystemRolePermissions(
    @Param('roleId') roleId: string,
    @Body() dto: ModifyRolePermissionsDto,
  ) {
    return this.adminService.addSystemRolePermissions(
      roleId,
      dto.permissionIds,
    );
  }

  @Delete('system-roles/:roleId/permissions/:permissionId')
  @ApiOperation({
    summary: 'Remove a permission from a system role',
  })
  removeSystemRolePermission(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.adminService.removeSystemRolePermission(roleId, permissionId);
  }

  @Get('system-roles/:id')
  @ApiOperation({
    summary: 'Get a single system role (SystemRole) by ID',
  })
  findOneSystemRole(@Param('id') id: string) {
    return this.adminService.findOneSystemRole(id);
  }

  @Patch('system-roles/:id')
  @ApiOperation({
    summary: 'Update a system role (SystemRole) and its permissions',
  })
  updateSystemRole(
    @Param('id') id: string,
    @Body() updateSystemRoleDto: UpdateSystemRoleDto,
  ) {
    return this.adminService.updateSystemRole(id, updateSystemRoleDto);
  }

  @Delete('system-roles/:id')
  @ApiOperation({
    summary: 'Delete a system role (SystemRole)',
  })
  removeSystemRole(@Param('id') id: string) {
    return this.adminService.removeSystemRole(id);
  }

  // ==========================================
  // 2. GLOBAL PERMISSIONS (/admin/permissions/*)
  // ==========================================

  @Post('permissions')
  @ApiOperation({
    summary: 'Create a global permission (resource + action)',
  })
  createPermission(@Body() createPermissionDto: CreatePermissionDto) {
    return this.adminService.createPermission(createPermissionDto);
  }

  @Get('permissions')
  @ApiOperation({
    summary: 'List all global permissions (paginated & filterable)',
  })
  findAllPermissions(@Query() queryDto: GetPermissionsQueryDto) {
    return this.adminService.findAllPermissions(queryDto);
  }

  @Delete('permissions/:id')
  @ApiOperation({
    summary: 'Delete a global permission by ID',
  })
  removePermission(@Param('id') id: string) {
    return this.adminService.removePermission(id);
  }
}

