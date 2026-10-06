import { Test, TestingModule } from '@nestjs/testing';
import { CqrsModule } from '@nestjs/cqrs';
import { RolesService } from './roles.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RoleCommandHandlers } from './commands';
import { RoleQueryHandlers } from './queries';

describe('RolesService', () => {
  let service: RolesService;
  let prisma: any;
  let module: TestingModule;

  const mockPrisma = {
    systemRole: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    orgRole: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    permission: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    systemRolePermission: {
      create: jest.fn(),
      upsert: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    orgRolePermission: {
      create: jest.fn(),
      upsert: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    org: {
      findUnique: jest.fn(),
    },
    userRole: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    userSystemRole: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [CqrsModule],
      providers: [
        RolesService,
        ...RoleCommandHandlers,
        ...RoleQueryHandlers,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    await module.init();

    service = module.get<RolesService>(RolesService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('OrgRole operations', () => {
    it('should create orgRole and link permissions', async () => {
      prisma.org.findUnique.mockResolvedValue({ id: 'org-id' });
      prisma.orgRole.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 'role-id',
          org_id: 'org-id',
          name: 'Role',
          permissions: [],
        });
      prisma.orgRole.create.mockResolvedValue({
        id: 'role-id',
        org_id: 'org-id',
        name: 'Role',
      });
      prisma.permission.findUnique.mockResolvedValue({ id: 'perm-id' });

      const dto = {
        org_id: 'org-id',
        name: 'Role',
        permissionIds: ['perm-id'],
      };

      const result = await service.createOrgRole(dto);

      expect(prisma.orgRole.create).toHaveBeenCalled();
      expect(prisma.orgRolePermission.create).toHaveBeenCalledWith({
        data: {
          org_role_id: 'role-id',
          permission_id: 'perm-id',
        },
      });
      expect(result).toBeDefined();
    });

    it('should throw BadRequestException if permission id does not exist', async () => {
      prisma.org.findUnique.mockResolvedValue({ id: 'org-id' });
      prisma.orgRole.findUnique.mockResolvedValue(null);
      prisma.orgRole.create.mockResolvedValue({
        id: 'role-id',
        org_id: 'org-id',
        name: 'Role',
      });
      prisma.permission.findUnique.mockResolvedValue(null);

      const dto = {
        org_id: 'org-id',
        name: 'Role',
        permissionIds: ['invalid-perm-id'],
      };

      await expect(service.createOrgRole(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should assign orgRole to user if not already assigned', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-id' });
      prisma.org.findUnique.mockResolvedValue({ id: 'org-id' });
      prisma.orgRole.findUnique.mockResolvedValue({
        id: 'role-id',
        org_id: 'org-id',
      });
      prisma.userRole.findUnique.mockResolvedValue(null);
      prisma.userRole.create.mockResolvedValue({
        user_id: 'user-id',
        role_id: 'role-id',
      });

      const result = await service.assignOrgRoleToUser(
        'user-id',
        'org-id',
        'role-id',
        'assigner-id',
      );

      expect(prisma.userRole.create).toHaveBeenCalled();
      expect(result).toEqual({ user_id: 'user-id', role_id: 'role-id' });
    });

    it('should attach permissions to an orgRole', async () => {
      prisma.orgRole.findUnique
        .mockResolvedValueOnce({ id: 'role-id', org_id: 'org-id', name: 'Manager' })
        .mockResolvedValueOnce({
          id: 'role-id',
          org_id: 'org-id',
          name: 'Manager',
          permissions: [{ permission: { id: 'perm-1', resource: 'products', action: 'read' } }],
        });
      prisma.permission.findUnique.mockResolvedValue({ id: 'perm-1' });
      prisma.orgRolePermission.upsert.mockResolvedValue({});

      const result = await service.addOrgRolePermissions('role-id', ['perm-1']);
      expect(prisma.orgRolePermission.upsert).toHaveBeenCalled();
      expect(result.permissions).toHaveLength(1);
    });
  });

  describe('SystemRole operations', () => {
    it('should create systemRole and link permissions', async () => {
      prisma.systemRole.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 'sys-role-id',
          key: 'SUPER_ADMIN',
          name: 'SUPER_ADMIN',
          is_org_template: false,
          permissions: [],
        });
      prisma.systemRole.create.mockResolvedValue({
        id: 'sys-role-id',
        key: 'SUPER_ADMIN',
        name: 'SUPER_ADMIN',
        is_org_template: false,
      });
      prisma.permission.findUnique.mockResolvedValue({ id: 'perm-id' });

      const dto = {
        name: 'SUPER_ADMIN',
        is_org_template: false,
        permissionIds: ['perm-id'],
      };

      const result = await service.createSystemRole(dto);

      expect(prisma.systemRole.create).toHaveBeenCalled();
      expect(prisma.systemRolePermission.create).toHaveBeenCalledWith({
        data: {
          system_role_id: 'sys-role-id',
          permission_id: 'perm-id',
        },
      });
      expect(result).toBeDefined();
    });

    it('should assign systemRole to user if not already assigned', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-id' });
      prisma.systemRole.findUnique.mockResolvedValue({
        id: 'sys-role-id',
        name: 'SUPER_ADMIN',
        is_org_template: false,
      });
      prisma.userSystemRole.findUnique.mockResolvedValue(null);
      prisma.userSystemRole.create.mockResolvedValue({
        user_id: 'user-id',
        system_role_id: 'sys-role-id',
      });

      const result = await service.assignSystemRoleToUser(
        'user-id',
        'sys-role-id',
        'assigner-id',
      );

      expect(prisma.userSystemRole.create).toHaveBeenCalled();
      expect(result).toEqual({
        user_id: 'user-id',
        system_role_id: 'sys-role-id',
      });
    });

    it('should reject assigning an org template SystemRole directly to a user', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-id' });
      prisma.systemRole.findUnique.mockResolvedValue({
        id: 'tpl-role-id',
        name: 'CASHIER',
        is_org_template: true,
      });

      await expect(
        service.assignSystemRoleToUser('user-id', 'tpl-role-id', 'assigner-id'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Permissions pagination & filtering', () => {
    it('should return paginated permissions with meta', async () => {
      prisma.permission.findMany.mockResolvedValue([
        { id: 'p1', resource: 'bills', action: 'create', description: 'Create bills' },
      ]);
      prisma.permission.count.mockResolvedValue(45);

      const result = await service.findAllPermissions({
        page: 2,
        limit: 10,
        resource: 'bills',
      });

      expect(prisma.permission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { resource: 'bills' },
          skip: 10,
          take: 10,
        }),
      );
      expect(result).toEqual({
        data: [
          { id: 'p1', resource: 'bills', action: 'create', description: 'Create bills' },
        ],
        meta: {
          total: 45,
          page: 2,
          limit: 10,
          totalPages: 5,
        },
      });
    });
  });
});


