import { Test, TestingModule } from '@nestjs/testing';
import { CqrsModule } from '@nestjs/cqrs';
import { OrgsService } from './orgs.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { MailService } from '../mail/mail.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrgCommandHandlers } from './commands';
import { OrgQueryHandlers } from './queries';
import { CreateOrgHandler } from '../workflows/commands/create-org.handler';
import { InviteMemberHandler } from '../workflows/commands/invite-member.handler';

describe('OrgsService', () => {
  let service: OrgsService;
  let prisma: any;
  let authService: any;
  let mailService: any;
  let module: TestingModule;

  const mockPrisma = {
    businessCategory: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    org: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    systemRole: {
      findMany: jest.fn(),
    },
    orgRole: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    orgRolePermission: {
      createMany: jest.fn(),
    },
    productCategoryTemplate: {
      findMany: jest.fn(),
    },
    productCategory: {
      create: jest.fn(),
    },
    userRole: {
      create: jest.fn(),
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
    },
    userLocation: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    inventoryLocation: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrisma)),
  };

  const mockAuthService = {
    register: jest.fn(),
  };

  const mockMailService = {
    sendWelcomeBackEmail: jest.fn(),
    sendInvitationEmail: jest.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [CqrsModule],
      providers: [
        OrgsService,
        ...OrgCommandHandlers,
        ...OrgQueryHandlers,
        CreateOrgHandler,
        InviteMemberHandler,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuthService, useValue: mockAuthService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    await module.init();

    service = module.get<OrgsService>(OrgsService);
    prisma = module.get<PrismaService>(PrismaService);
    authService = module.get<AuthService>(AuthService);
    mailService = module.get<MailService>(MailService);

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

  describe('create', () => {
    it('should throw BadRequestException if business category does not exist', async () => {
      prisma.businessCategory.findUnique.mockResolvedValue(null);

      await expect(
        service.create({ businesscategory_id: 'invalid-cat' }, 'owner-uuid'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if owner user does not exist', async () => {
      prisma.businessCategory.findUnique.mockResolvedValue({
        id: 'cat-id',
        type: 'RETAIL',
      });
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.create({ businesscategory_id: 'cat-id' }, 'owner-uuid'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create organization, provision OrgRoles from SystemRole templates, and assign entrypoint Owner role', async () => {
      prisma.businessCategory.findUnique.mockResolvedValue({
        id: 'cat-id',
        type: 'RETAIL',
      });
      prisma.user.findUnique.mockResolvedValue({
        id: 'owner-uuid',
        email: 'owner@example.com',
      });
      prisma.systemRole.findMany.mockResolvedValue([
        {
          id: 'sys-owner-id',
          key: 'OWNER',
          name: 'Owner',
          description: 'Organization Owner',
          is_org_template: true,
          is_org_entrypoint: true,
          is_location_scoped: false,
          permissions: [{ permission_id: 'perm-1' }],
        },
      ]);
      prisma.org.create.mockResolvedValue({
        id: 'org-id',
        owner_id: 'owner-uuid',
      });
      prisma.orgRole.create.mockResolvedValue({
        id: 'owner-org-role-id',
        org_id: 'org-id',
        name: 'Owner',
        is_builtin: true,
        is_entrypoint: true,
      });
      prisma.productCategoryTemplate.findMany.mockResolvedValue([
        {
          id: 'tpl-cat-1',
          businesscategory_id: 'cat-id',
          parent_id: null,
          name: 'General Merchandise',
          level: 0,
        },
      ]);
      prisma.productCategory.create.mockResolvedValue({
        id: 'org-cat-1',
        org_id: 'org-id',
        template_id: 'tpl-cat-1',
        name: 'General Merchandise',
        level: 0,
      });

      const result = await service.create(
        { businesscategory_id: 'cat-id', address: '123 St', phone: '123456' },
        'owner-uuid',
      );

      expect(prisma.org.create).toHaveBeenCalled();
      expect(prisma.orgRole.create).toHaveBeenCalledWith({
        data: {
          org_id: 'org-id',
          system_role_id: 'sys-owner-id',
          name: 'Owner',
          description: 'Organization Owner',
          is_builtin: true,
          is_entrypoint: true,
          is_location_scoped: false,
        },
      });
      expect(prisma.userRole.create).toHaveBeenCalledWith({
        data: {
          user_id: 'owner-uuid',
          role_id: 'owner-org-role-id',
          org_id: 'org-id',
          assigned_by: 'owner-uuid',
        },
      });
      expect(prisma.productCategory.create).toHaveBeenCalled();
      expect(result).toEqual({ id: 'org-id', owner_id: 'owner-uuid' });
    });
  });

  describe('addMember', () => {
    it('should add existing user and send welcome back email', async () => {
      prisma.org.findUnique.mockResolvedValue({ id: 'org-id' });
      prisma.user.findUnique.mockResolvedValue({
        id: 'existing-user-id',
        email: 'existing@example.com',
      });
      prisma.orgRole.findUnique.mockResolvedValue({
        id: 'role-id',
        org_id: 'org-id',
        name: 'Cashier',
      });
      prisma.userRole.findUnique.mockResolvedValue(null);

      const inviteDto = {
        email: 'existing@example.com',
        roleIds: ['role-id'],
      };

      const result = await service.addMember(
        'org-id',
        inviteDto,
        'assigner-id',
      );

      expect(prisma.userRole.create).toHaveBeenCalled();
      expect(mailService.sendWelcomeBackEmail).toHaveBeenCalledWith(
        'existing@example.com',
        'org-id',
      );
      expect(result.message).toContain('Existing user');
    });

    it('should register new user in auth, create profile and send invitation email', async () => {
      prisma.org.findUnique.mockResolvedValue({ id: 'org-id' });
      prisma.user.findUnique.mockResolvedValue(null);
      authService.register.mockResolvedValue({ user: { id: 'new-user-uuid' } });
      prisma.user.create.mockResolvedValue({
        id: 'new-user-uuid',
        email: 'new@example.com',
        fullname: 'New User',
      });
      prisma.orgRole.findUnique.mockResolvedValue({
        id: 'role-id',
        org_id: 'org-id',
        name: 'Cashier',
      });
      prisma.userRole.findUnique.mockResolvedValue(null);

      const inviteDto = {
        email: 'new@example.com',
        fullname: 'New User',
        roleIds: ['role-id'],
      };

      const result = await service.addMember(
        'org-id',
        inviteDto,
        'assigner-id',
      );

      expect(authService.register).toHaveBeenCalled();
      expect(prisma.user.create).toHaveBeenCalled();
      expect(prisma.userRole.create).toHaveBeenCalled();
      expect(mailService.sendInvitationEmail).toHaveBeenCalled();
      expect(result.message).toContain('User invited');
      expect(result.tempPassword).toBeDefined();
    });
  });
});
