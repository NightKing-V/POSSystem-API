import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async create(createInventoryDto: CreateInventoryDto) {
    // Verify Org exists
    const org = await this.prisma.org.findUnique({
      where: { id: createInventoryDto.org_id },
    });
    if (!org) {
      throw new NotFoundException(`Organization with ID "${createInventoryDto.org_id}" not found`);
    }

    return this.prisma.inventoryLocation.create({
      data: {
        org_id: createInventoryDto.org_id,
        name: createInventoryDto.name,
        type: createInventoryDto.type,
        address: createInventoryDto.address || null,
        phone: createInventoryDto.phone || null,
        is_active: createInventoryDto.is_active !== undefined ? createInventoryDto.is_active : true,
      },
    });
  }

  async findAll(orgId?: string) {
    return this.prisma.inventoryLocation.findMany({
      where: orgId ? { org_id: orgId } : undefined,
      include: {
        org: true,
        _count: {
          select: {
            user_locations: true,
            stocks: true,
            transactions: true,
            pos: true,
            bills: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const location = await this.prisma.inventoryLocation.findUnique({
      where: { id },
      include: {
        org: true,
        _count: {
          select: {
            user_locations: true,
            stocks: true,
            transactions: true,
            pos: true,
            bills: true,
          },
        },
      },
    });
    if (!location) {
      throw new NotFoundException(`Inventory location with ID "${id}" not found`);
    }
    return location;
  }

  async update(id: string, updateInventoryDto: UpdateInventoryDto) {
    await this.findOne(id);

    return this.prisma.inventoryLocation.update({
      where: { id },
      data: {
        name: updateInventoryDto.name,
        type: updateInventoryDto.type,
        address: updateInventoryDto.address,
        phone: updateInventoryDto.phone,
        is_active: updateInventoryDto.is_active,
      },
    });
  }

  async remove(id: string) {
    const location = await this.findOne(id);

    if (
      location._count.stocks > 0 ||
      location._count.transactions > 0 ||
      location._count.pos > 0 ||
      location._count.bills > 0
    ) {
      throw new BadRequestException(
        `Cannot delete location with ID "${id}" because it is referenced in stocks, transactions, purchase orders, or bills.`,
      );
    }

    // Cascade delete user location assignments
    await this.prisma.userLocation.deleteMany({
      where: { location_id: id },
    });

    return this.prisma.inventoryLocation.delete({
      where: { id },
    });
  }

  // ==========================================
  // USER LOCATION ASSIGNMENT LOGIC
  // ==========================================

  async assignUser(locationId: string, userId: string, assignerId?: string) {
    // Verify location
    await this.findOne(locationId);

    // Verify user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    // Check if assigner exists
    if (assignerId) {
      const assigner = await this.prisma.user.findUnique({
        where: { id: assignerId },
      });
      if (!assigner) {
        throw new NotFoundException(`Assigner user with ID "${assignerId}" not found`);
      }
    }

    // Check if already assigned
    const existing = await this.prisma.userLocation.findUnique({
      where: {
        user_id_location_id: {
          user_id: userId,
          location_id: locationId,
        },
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.userLocation.create({
      data: {
        user_id: userId,
        location_id: locationId,
        assigned_by: assignerId || null,
      },
      include: {
        user: true,
        location: true,
      },
    });
  }

  async unassignUser(locationId: string, userId: string) {
    const existing = await this.prisma.userLocation.findUnique({
      where: {
        user_id_location_id: {
          user_id: userId,
          location_id: locationId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(
        `Assignment of user "${userId}" to location "${locationId}" not found`,
      );
    }

    await this.prisma.userLocation.delete({
      where: {
        user_id_location_id: {
          user_id: userId,
          location_id: locationId,
        },
      },
    });

    return { message: 'User unassigned from location successfully' };
  }

  async listUsers(locationId: string) {
    await this.findOne(locationId);
    return this.prisma.userLocation.findMany({
      where: { location_id: locationId },
      include: {
        user: true,
      },
    });
  }

  async listLocationsForUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    return this.prisma.userLocation.findMany({
      where: { user_id: userId },
      include: {
        location: true,
      },
    });
  }
}

