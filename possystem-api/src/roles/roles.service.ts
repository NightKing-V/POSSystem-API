import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  // ==========================================
  // ROLES CRUD
  // ==========================================

  async create(createRoleDto: CreateRoleDto) {
    const { permissionIds, ...roleData } = createRoleDto;

    const role = await this.prisma.role.create({
      data: {
        name: roleData.name,
        description: roleData.description || null,
        is_system: roleData.is_system || false,
        is_location_scoped: roleData.is_location_scoped || false,
      },
    });

    if (permissionIds && permissionIds.length > 0) {
      for (const permissionId of permissionIds) {
        // Verify permission exists
        const permission = await this.prisma.permission.findUnique({
          where: { id: permissionId },
        });

        if (!permission) {
          throw new BadRequestException(
            `Permission with ID "${permissionId}" not found`,
          );
        }

        await this.prisma.rolePermission.create({
          data: {
            role_id: role.id,
            permission_id: permissionId,
          },
        });
      }
    }

    return this.findOne(role.id);
  }

  async findAll() {
    return this.prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID "${id}" not found`);
    }

    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException(`Role with ID "${id}" not found`);
    }

    const { permissionIds, ...roleData } = updateRoleDto;

    await this.prisma.role.update({
      where: { id },
      data: {
        name: roleData.name,
        description: roleData.description,
        is_system: roleData.is_system,
        is_location_scoped: roleData.is_location_scoped,
      },
    });

    if (permissionIds !== undefined) {
      // Clear existing permissions
      await this.prisma.rolePermission.deleteMany({
        where: { role_id: id },
      });

      // Assign new ones
      for (const permissionId of permissionIds) {
        const permission = await this.prisma.permission.findUnique({
          where: { id: permissionId },
        });

        if (!permission) {
          throw new BadRequestException(
            `Permission with ID "${permissionId}" not found`,
          );
        }

        await this.prisma.rolePermission.create({
          data: {
            role_id: id,
            permission_id: permissionId,
          },
        });
      }
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException(`Role with ID "${id}" not found`);
    }

    // Delete relation records first
    await this.prisma.rolePermission.deleteMany({
      where: { role_id: id },
    });

    await this.prisma.userRole.deleteMany({
      where: { role_id: id },
    });

    return this.prisma.role.delete({
      where: { id },
    });
  }

  // ==========================================
  // PERMISSIONS CRUD
  // ==========================================

  async createPermission(createPermissionDto: CreatePermissionDto) {
    // Check if permission already exists
    const existing = await this.prisma.permission.findFirst({
      where: {
        resource: createPermissionDto.resource,
        action: createPermissionDto.action,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Permission already exists for this resource and action',
      );
    }

    return this.prisma.permission.create({
      data: createPermissionDto,
    });
  }

  async findAllPermissions() {
    return this.prisma.permission.findMany();
  }

  async removePermission(id: string) {
    const perm = await this.prisma.permission.findUnique({ where: { id } });
    if (!perm) {
      throw new NotFoundException(`Permission with ID "${id}" not found`);
    }

    // Delete relationship mappings
    await this.prisma.rolePermission.deleteMany({
      where: { permission_id: id },
    });

    return this.prisma.permission.delete({
      where: { id },
    });
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
    // Validate User
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    // Validate Org
    const org = await this.prisma.org.findUnique({ where: { id: orgId } });
    if (!org) {
      throw new NotFoundException(`Organization with ID "${orgId}" not found`);
    }

    // Validate Role
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException(`Role with ID "${roleId}" not found`);
    }

    // Check if assignment already exists
    const existing = await this.prisma.userRole.findUnique({
      where: {
        user_id_role_id_org_id: {
          user_id: userId,
          role_id: roleId,
          org_id: orgId,
        },
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.userRole.create({
      data: {
        user_id: userId,
        role_id: roleId,
        org_id: orgId,
        assigned_by: assignerId,
      },
    });
  }

  async removeRoleFromUser(userId: string, orgId: string, roleId: string) {
    const existing = await this.prisma.userRole.findUnique({
      where: {
        user_id_role_id_org_id: {
          user_id: userId,
          role_id: roleId,
          org_id: orgId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Role assignment not found');
    }

    return this.prisma.userRole.delete({
      where: {
        user_id_role_id_org_id: {
          user_id: userId,
          role_id: roleId,
          org_id: orgId,
        },
      },
    });
  }

  async getUserRoles(userId: string, orgId: string) {
    return this.prisma.userRole.findMany({
      where: {
        user_id: userId,
        org_id: orgId,
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });
  }
}
