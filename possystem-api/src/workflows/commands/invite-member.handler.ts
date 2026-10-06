import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InviteMemberCommand } from './invite-member.command';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../../auth/auth.service';
import { MailService } from '../../mail/mail.service';

@CommandHandler(InviteMemberCommand)
export class InviteMemberHandler implements ICommandHandler<InviteMemberCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly mailService: MailService,
  ) {}

  async execute(command: InviteMemberCommand) {
    const { orgId, inviteDto, assignerId } = command;

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
        // Verify organization role exists and belongs to this organization
        const role = await this.prisma.orgRole.findUnique({
          where: { id: roleId },
        });

        if (!role) {
          throw new BadRequestException(`Role with ID "${roleId}" not found`);
        }

        if (role.org_id !== orgId) {
          throw new BadRequestException(
            `Role with ID "${roleId}" does not belong to organization "${orgId}"`,
          );
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
      tempPassword: isNewUser ? tempPassword : undefined,
    };
  }
}
