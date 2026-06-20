import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrgDto } from './dto/create-org.dto';
import { UpdateOrgDto } from './dto/update-org.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { AuthService } from '../auth/auth.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class OrgsService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
    private mailService: MailService,
  ) {}

  async create(createOrgDto: CreateOrgDto, ownerId: string) {
    // Verify business category exists
    const category = await this.prisma.businessCategory.findUnique({
      where: { id: createOrgDto.businesscategory_id },
    });

    if (!category) {
      throw new BadRequestException('Business category not found');
    }

    // Verify owner user exists
    const owner = await this.prisma.user.findUnique({
      where: { id: ownerId },
    });

    if (!owner) {
      throw new NotFoundException('Owner user not found');
    }

    // Create the organization
    const org = await this.prisma.org.create({
      data: {
        owner_id: ownerId,
        businesscategory_id: createOrgDto.businesscategory_id,
        address: createOrgDto.address || null,
        phone: createOrgDto.phone || null,
      },
    });

    // Assign owner to the default Owner role in UserRole
    let ownerRole = await this.prisma.role.findFirst({
      where: { name: 'Owner' },
    });

    if (!ownerRole) {
      ownerRole = await this.prisma.role.create({
        data: {
          name: 'Owner',
          description: 'Organization Owner',
          is_system: true,
          is_location_scoped: false,
        },
      });
    }

    await this.prisma.userRole.create({
      data: {
        user_id: ownerId,
        role_id: ownerRole.id,
        org_id: org.id,
        assigned_by: ownerId,
      },
    });

    return org;
  }

  async findAll() {
    return this.prisma.org.findMany({
      include: {
        business_category: true,
        owner: true,
      },
    });
  }

  async findOne(id: string) {
    const org = await this.prisma.org.findUnique({
      where: { id },
      include: {
        business_category: true,
        owner: true,
        user_roles: {
          include: {
            role: true,
            user: true,
          },
        },
      },
    });

    if (!org) {
      throw new NotFoundException(`Organization with ID "${id}" not found`);
    }

    return org;
  }

  async update(id: string, updateOrgDto: UpdateOrgDto) {
    const org = await this.prisma.org.findUnique({ where: { id } });
    if (!org) {
      throw new NotFoundException(`Organization with ID "${id}" not found`);
    }

    if (updateOrgDto.businesscategory_id) {
      const category = await this.prisma.businessCategory.findUnique({
        where: { id: updateOrgDto.businesscategory_id },
      });
      if (!category) {
        throw new BadRequestException('Business category not found');
      }
    }

    return this.prisma.org.update({
      where: { id },
      data: {
        businesscategory_id: updateOrgDto.businesscategory_id,
        address: updateOrgDto.address,
        phone: updateOrgDto.phone,
      },
    });
  }

  async remove(id: string) {
    const org = await this.prisma.org.findUnique({ where: { id } });
    if (!org) {
      throw new NotFoundException(`Organization with ID "${id}" not found`);
    }

    // Cascade delete user roles associated with this org
    await this.prisma.userRole.deleteMany({
      where: { org_id: id },
    });

    return this.prisma.org.delete({
      where: { id },
    });
  }

  async addMember(
    orgId: string,
    inviteDto: InviteMemberDto,
    assignerId: string,
  ) {
    // Verify organization exists
    const org = await this.prisma.org.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new NotFoundException(`Organization with ID "${orgId}" not found`);
    }

    // Check if user exists in the local database
    let user = await this.prisma.user.findUnique({
      where: { email: inviteDto.email },
    });

    let isNewUser = false;
    let tempPassword = '';

    if (!user) {
      isNewUser = true;
      // Generate a temporary secure password
      tempPassword =
        'Temp-' +
        Math.random().toString(36).substring(2, 10) +
        Math.random().toString(36).substring(2, 6).toUpperCase() +
        '!';

      // Register the user in Supabase auth
      const authData = await this.authService.register(
        inviteDto.email,
        tempPassword,
      );

      if (!authData || !authData.user) {
        throw new BadRequestException(
          'Failed to register user in Auth provider',
        );
      }

      // Create the user profile locally using the Supabase UUID
      user = await this.prisma.user.create({
        data: {
          id: authData.user.id,
          email: inviteDto.email,
          fullname: inviteDto.fullname || inviteDto.email.split('@')[0],
        },
      });
    }

    // Assign roles in UserRole table
    if (inviteDto.roleIds && inviteDto.roleIds.length > 0) {
      for (const roleId of inviteDto.roleIds) {
        // Verify role exists
        const role = await this.prisma.role.findUnique({
          where: { id: roleId },
        });

        if (!role) {
          throw new BadRequestException(`Role with ID "${roleId}" not found`);
        }

        // Check if role is already assigned
        const existingAssignment = await this.prisma.userRole.findUnique({
          where: {
            user_id_role_id_org_id: {
              user_id: user.id,
              role_id: roleId,
              org_id: orgId,
            },
          },
        });

        if (!existingAssignment) {
          await this.prisma.userRole.create({
            data: {
              user_id: user.id,
              role_id: roleId,
              org_id: orgId,
              assigned_by: assignerId,
            },
          });
        }
      }
    }

    // Assign locations in UserLocation table
    if (inviteDto.locationIds && inviteDto.locationIds.length > 0) {
      for (const locationId of inviteDto.locationIds) {
        // Verify location exists and belongs to this organization
        const location = await this.prisma.inventoryLocation.findUnique({
          where: { id: locationId },
        });

        if (!location) {
          throw new BadRequestException(
            `Location with ID "${locationId}" not found`,
          );
        }

        if (location.org_id !== orgId) {
          throw new BadRequestException(
            `Location with ID "${locationId}" does not belong to organization "${orgId}"`,
          );
        }

        // Check if location is already assigned
        const existingLocationAssignment =
          await this.prisma.userLocation.findUnique({
            where: {
              user_id_location_id: {
                user_id: user.id,
                location_id: locationId,
              },
            },
          });

        if (!existingLocationAssignment) {
          await this.prisma.userLocation.create({
            data: {
              user_id: user.id,
              location_id: locationId,
              assigned_by: assignerId,
            },
          });
        }
      }
    }

    // Send emails
    if (isNewUser) {
      await this.mailService.sendInvitationEmail(inviteDto.email, tempPassword);
    } else {
      await this.mailService.sendWelcomeBackEmail(inviteDto.email, orgId);
    }

    return {
      message: isNewUser
        ? 'User invited and added to organization successfully.'
        : 'Existing user added to organization successfully.',
      user: {
        id: user.id,
        email: user.email,
        fullname: user.fullname,
      },
      // Return temporary password only if the user is newly created (helpful for testing/development)
      tempPassword: isNewUser ? tempPassword : undefined,
    };
  }
}
