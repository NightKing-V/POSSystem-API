import { Test, TestingModule } from '@nestjs/testing';
import { CqrsModule } from '@nestjs/cqrs';
import { RolesService } from './roles.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { RoleCommandHandlers } from './commands';
import { RoleQueryHandlers } from './queries';

describe('RolesService', () => {
  let service: RolesService;
  let prisma: any;
  let module: TestingModule;

  const mockPrisma = {
    role: {
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
    },
    rolePermission: {
      create: jest.fn(),
      deleteMany: jest.fn(),
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

  describe('createRole', () => {
    it('should create role and link permissions', async () => {
      prisma.role.create.mockResolvedValue({ id: 'role-id', name: 'Role' });
      prisma.permission.findUnique.mockResolvedValue({ id: 'perm-id' });
      prisma.role.findUnique.mockResolvedValue({
        id: 'role-id',
        name: 'Role',
        permissions: [],
      });

      const dto = {
        name: 'Role',
        permissionIds: ['perm-id'],
      };

      const result = await service.create(dto);

      expect(prisma.role.create).toHaveBeenCalled();
      expect(prisma.rolePermission.create).toHaveBeenCalledWith({
        data: {
          role_id: 'role-id',
          permission_id: 'perm-id',
        },
      });
      expect(result).toBeDefined();
    });

    it('should throw BadRequestException if permission id does not exist', async () => {
      prisma.role.create.mockResolvedValue({ id: 'role-id', name: 'Role' });
      prisma.permission.findUnique.mockResolvedValue(null);

      const dto = {
        name: 'Role',
        permissionIds: ['invalid-perm-id'],
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('assignRoleToUser', () => {
    it('should throw NotFoundException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.assignRoleToUser(
          'invalid-user',
          'org-id',
          'role-id',
          'assigner-id',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should assign role to user if not already assigned', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-id' });
      prisma.org.findUnique.mockResolvedValue({ id: 'org-id' });
      prisma.role.findUnique.mockResolvedValue({ id: 'role-id' });
      prisma.userRole.findUnique.mockResolvedValue(null);
      prisma.userRole.create.mockResolvedValue({
        user_id: 'user-id',
        role_id: 'role-id',
      });

      const result = await service.assignRoleToUser(
        'user-id',
        'org-id',
        'role-id',
        'assigner-id',
      );

      expect(prisma.userRole.create).toHaveBeenCalled();
      expect(result).toEqual({ user_id: 'user-id', role_id: 'role-id' });
    });

    it('should return existing assignment if already assigned', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-id' });
      prisma.org.findUnique.mockResolvedValue({ id: 'org-id' });
      prisma.role.findUnique.mockResolvedValue({ id: 'role-id' });
      prisma.userRole.findUnique.mockResolvedValue({
        user_id: 'user-id',
        role_id: 'role-id',
      });

      const result = await service.assignRoleToUser(
        'user-id',
        'org-id',
        'role-id',
        'assigner-id',
      );

      expect(prisma.userRole.create).not.toHaveBeenCalled();
      expect(result).toEqual({ user_id: 'user-id', role_id: 'role-id' });
    });
  });
});
