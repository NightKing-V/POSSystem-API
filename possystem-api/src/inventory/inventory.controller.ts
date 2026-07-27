import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  create(@Body() createInventoryDto: CreateInventoryDto) {
    return this.inventoryService.create(createInventoryDto);
  }

  @Get()
  findAll(@Query('orgId') orgId?: string) {
    return this.inventoryService.findAll(orgId);
  }

  @Get('users/:userId')
  listLocationsForUser(@Param('userId') userId: string) {
    return this.inventoryService.listLocationsForUser(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateInventoryDto: UpdateInventoryDto,
  ) {
    return this.inventoryService.update(id, updateInventoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.inventoryService.remove(id);
  }

  // ==========================================
  // USER LOCATION ASSIGNMENT ENDPOINTS
  // ==========================================

  @Post(':locationId/users/:userId')
  assignUser(
    @Param('locationId') locationId: string,
    @Param('userId') userId: string,
    @Request() req: { user: { userId: string } },
  ) {
    const assignerId = req.user.userId;
    return this.inventoryService.assignUser(locationId, userId, assignerId);
  }

  @Delete(':locationId/users/:userId')
  unassignUser(
    @Param('locationId') locationId: string,
    @Param('userId') userId: string,
  ) {
    return this.inventoryService.unassignUser(locationId, userId);
  }

  @Get(':locationId/users')
  listUsers(@Param('locationId') locationId: string) {
    return this.inventoryService.listUsers(locationId);
  }
}

