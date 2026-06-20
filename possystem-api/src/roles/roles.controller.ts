import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('roles')
@UseGuards(JwtAuthGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  // ==========================================
  // ROLES ENDPOINTS
  // ==========================================

  @Post()
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }

  // ==========================================
  // PERMISSIONS ENDPOINTS
  // ==========================================

  @Post('permissions')
  createPermission(@Body() createPermissionDto: CreatePermissionDto) {
    return this.rolesService.createPermission(createPermissionDto);
  }

  @Get('permissions/all')
  findAllPermissions() {
    return this.rolesService.findAllPermissions();
  }

  @Delete('permissions/:id')
  removePermission(@Param('id') id: string) {
    return this.rolesService.removePermission(id);
  }

  // ==========================================
  // USER ROLE ASSIGNMENTS
  // ==========================================

  @Post('assign/:orgId/:userId')
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

  @Delete('unassign/:orgId/:userId/:roleId')
  unassignRole(
    @Param('orgId') orgId: string,
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.rolesService.removeRoleFromUser(userId, orgId, roleId);
  }

  @Get('user-roles/:orgId/:userId')
  getUserRoles(@Param('orgId') orgId: string, @Param('userId') userId: string) {
    return this.rolesService.getUserRoles(userId, orgId);
  }
}
