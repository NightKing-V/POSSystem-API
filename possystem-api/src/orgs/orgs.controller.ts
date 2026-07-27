import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OrgsService } from './orgs.service';
import { CreateOrgDto } from './dto/create-org.dto';
import { UpdateOrgDto } from './dto/update-org.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('orgs')
@UseGuards(JwtAuthGuard)
export class OrgsController {
  constructor(private readonly orgsService: OrgsService) {}

  @Post()
  create(
    @Body() createOrgDto: CreateOrgDto,
    @Request() req: { user: { userId: string; email: string } },
  ) {
    const userId = req.user.userId;
    return this.orgsService.create(createOrgDto, userId);
  }

  @Get()
  findAll(@Request() req: { user: { userId: string; email: string } }) {
    const userId = req.user.userId;
    return this.orgsService.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orgsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrgDto: UpdateOrgDto) {
    return this.orgsService.update(id, updateOrgDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orgsService.remove(id);
  }

  @Post(':id/members')
  addMember(
    @Param('id') id: string,
    @Body() inviteMemberDto: InviteMemberDto,
    @Request() req: { user: { userId: string; email: string } },
  ) {
    const assignerId = req.user.userId;
    return this.orgsService.addMember(id, inviteMemberDto, assignerId);
  }
}
