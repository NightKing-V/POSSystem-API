import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { OrgsService } from './orgs.service';
import { CreateOrgDto } from './dto/create-org.dto';
import { UpdateOrgDto } from './dto/update-org.dto';

@Controller('orgs')
export class OrgsController {
  constructor(private readonly orgsService: OrgsService) {}

  @Post()
  create(@Body() createOrgDto: CreateOrgDto) {
    return this.orgsService.create(createOrgDto);
  }

  @Get()
  findAll() {
    return this.orgsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orgsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrgDto: UpdateOrgDto) {
    return this.orgsService.update(+id, updateOrgDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orgsService.remove(+id);
  }
}
