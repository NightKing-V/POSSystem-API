import { Test, TestingModule } from '@nestjs/testing';
import { CqrsModule } from '@nestjs/cqrs';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException } from '@nestjs/common';
import { AdminCommandHandlers } from './commands';
import { AdminQueryHandlers } from './queries';

describe('AdminService (System Roles & Global Permissions)', () => {
  let service: AdminService;
  let prisma: any;
  let module: TestingModule;

  const mockPrisma = {
    permission: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    systemRole: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    systemRolePermission: {
      create: jest.fn(),
      upsert: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    userSystemRole: {
      create: jest.fn(),
      upsert: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [CqrsModule],
      providers: [
        AdminService,
        ...AdminCommandHandlers,
        ...AdminQueryHandlers,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    await module.init();

    service = module.get<AdminService>(AdminService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Permission CRUD & Pagination', () => {
    it('should create a permission', async () => {
      const dto = {
        resource: 'products',
        action: 'create',
        description: 'Can create products',
      };
      prisma.permission.findFirst.mockResolvedValue(null);
      prisma.permission.create.mockResolvedValue({ id: 'p-1', ...dto });

      const result = await service.createPermission(dto);
      expect(result).toEqual({ id: 'p-1', ...dto });
      expect(prisma.permission.create).toHaveBeenCalledWith({ data: dto });
    });

    it('should throw ConflictException if permission already exists', async () => {
      const dto = { resource: 'products', action: 'create' };
      prisma.permission.findFirst.mockResolvedValue({ id: 'p-1', ...dto });

      await expect(service.createPermission(dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should return paginated permissions', async () => {
      prisma.permission.findMany.mockResolvedValue([
        { id: 'p-1', resource: 'products', action: 'read' },
      ]);
      prisma.permission.count.mockResolvedValue(1);

      const result = await service.findAllPermissions({ page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });
  });

  describe('SystemRole Operations', () => {
    it('should create a system role with permissions', async () => {
      const dto = {
        key: 'SUPPORT_ADMIN',
        name: 'Support Admin',
        permissionIds: ['p-1'],
      };
      prisma.systemRole.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 'sr-1',
          key: 'SUPPORT_ADMIN',
          name: 'Support Admin',
          permissions: [{ permission_id: 'p-1' }],
        });
      prisma.systemRole.create.mockResolvedValue({
        id: 'sr-1',
        key: 'SUPPORT_ADMIN',
        name: 'Support Admin',
      });
      prisma.permission.findUnique.mockResolvedValue({ id: 'p-1' });
      prisma.systemRolePermission.create.mockResolvedValue({});

      const result = await service.createSystemRole(dto);
      expect(result?.key).toBe('SUPPORT_ADMIN');
      expect(prisma.systemRolePermission.create).toHaveBeenCalledWith({
        data: { system_role_id: 'sr-1', permission_id: 'p-1' },
      });
    });

    it('should assign a system role to a user', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u-1' });
      prisma.systemRole.findUnique.mockResolvedValue({ id: 'sr-1' });
      prisma.userSystemRole.findUnique.mockResolvedValue(null);
      prisma.userSystemRole.create.mockResolvedValue({
        user_id: 'u-1',
        system_role_id: 'sr-1',
      });

      const result = await service.assignSystemRoleToUser(
        'u-1',
        'sr-1',
        'admin-1',
      );
      expect(result.system_role_id).toBe('sr-1');
    });
  });
});
