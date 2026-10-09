import { Test, TestingModule } from '@nestjs/testing';
import { CqrsModule } from '@nestjs/cqrs';
import { RolesService } from './roles.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { RoleCommandHandlers } from './commands';
import { RoleQueryHandlers } from './queries';

describe('RolesService (Organization Roles & Memberships)', () => {
  let service: RolesService;
  let prisma: any;
  let module: TestingModule;

  const mockPrisma = {
    orgRole: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    permission: {
      findUnique: jest.fn(),
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
    orgMember: {
      create: jest.fn(),
      upsert: jest.fn(),
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

  describe('OrgRole & OrgMember operations', () => {
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

      const result = await service.create(dto);

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

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should upsert OrgMember with single role in org', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-id' });
      prisma.org.findUnique.mockResolvedValue({ id: 'org-id' });
      prisma.orgRole.findUnique.mockResolvedValue({
        id: 'role-id',
        org_id: 'org-id',
      });
      prisma.orgMember.upsert.mockResolvedValue({
        user_id: 'user-id',
        org_id: 'org-id',
        role_id: 'role-id',
      });

      const result = await service.assignRoleToUser(
        'user-id',
        'org-id',
        'role-id',
        'assigner-id',
      );

      expect(prisma.orgMember.upsert).toHaveBeenCalled();
      expect(result).toEqual({
        user_id: 'user-id',
        org_id: 'org-id',
        role_id: 'role-id',
      });
    });

    it('should reject assigning a role from a different org', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-id' });
      prisma.org.findUnique.mockResolvedValue({ id: 'org-1' });
      prisma.orgRole.findUnique.mockResolvedValue({
        id: 'role-id',
        org_id: 'org-2',
      });

      await expect(
        service.assignRoleToUser('user-id', 'org-1', 'role-id', 'assigner-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should attach permissions to an orgRole', async () => {
      prisma.orgRole.findUnique
        .mockResolvedValueOnce({
          id: 'role-id',
          org_id: 'org-id',
          name: 'Manager',
        })
        .mockResolvedValueOnce({
          id: 'role-id',
          org_id: 'org-id',
          name: 'Manager',
          _count: { members: 0, permissions: 1 },
        });
      prisma.permission.findUnique.mockResolvedValue({ id: 'perm-1' });
      prisma.orgRolePermission.upsert.mockResolvedValue({});

      const result = await service.addRolePermissions('role-id', ['perm-1']);
      expect(prisma.orgRolePermission.upsert).toHaveBeenCalled();
      expect(result._count.permissions).toBe(1);
    });
  });
});
