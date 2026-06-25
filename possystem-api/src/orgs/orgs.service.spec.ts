import { Test, TestingModule } from '@nestjs/testing';
import { OrgsService } from './orgs.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { MailService } from '../mail/mail.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('OrgsService', () => {
  let service: OrgsService;
  let prisma: any;
  let authService: any;
  let mailService: any;

  const mockPrisma = {
    businessCategory: {
      findUnique: jest.fn(),
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
    role: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
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
    },
  };

  const mockAuthService = {
    register: jest.fn(),
  };

  const mockMailService = {
    sendWelcomeBackEmail: jest.fn(),
    sendInvitationEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrgsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuthService, useValue: mockAuthService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<OrgsService>(OrgsService);
    prisma = module.get<PrismaService>(PrismaService);
    authService = module.get<AuthService>(AuthService);
    mailService = module.get<MailService>(MailService);

    jest.clearAllMocks();
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

    it('should create organization and assign Owner role', async () => {
      prisma.businessCategory.findUnique.mockResolvedValue({
        id: 'cat-id',
        type: 'RETAIL',
      });
      prisma.user.findUnique.mockResolvedValue({
        id: 'owner-uuid',
        email: 'owner@example.com',
      });
      prisma.org.create.mockResolvedValue({
        id: 'org-id',
        owner_id: 'owner-uuid',
      });
      prisma.role.findFirst.mockResolvedValue({
        id: 'owner-role-id',
        name: 'Owner',
      });

      const result = await service.create(
        { businesscategory_id: 'cat-id', address: '123 St', phone: '123456' },
        'owner-uuid',
      );

      expect(prisma.org.create).toHaveBeenCalled();
      expect(prisma.userRole.create).toHaveBeenCalledWith({
        data: {
          user_id: 'owner-uuid',
          role_id: 'owner-role-id',
          org_id: 'org-id',
          assigned_by: 'owner-uuid',
        },
      });
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
      prisma.role.findUnique.mockResolvedValue({
        id: 'role-id',
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
      prisma.user.findUnique.mockResolvedValue(null); // not existing
      authService.register.mockResolvedValue({ user: { id: 'new-user-uuid' } });
      prisma.user.create.mockResolvedValue({
        id: 'new-user-uuid',
        email: 'new@example.com',
        fullname: 'New User',
      });
      prisma.role.findUnique.mockResolvedValue({
        id: 'role-id',
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
