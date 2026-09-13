import { Controller, Get, Post, Body, Param, Put, UseGuards } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @Roles('RANGE_ADMIN')
  create(@Body() createOrgDto: { name: string; contactEmail?: string; contactPhone?: string }) {
    return this.organizationsService.createOrganization(createOrgDto);
  }

  @Get()
  @Roles('RANGE_ADMIN', 'RSO', 'STAFF')
  findAll() {
    return this.organizationsService.getAllOrganizations();
  }

  @Get(':id')
  @Roles('RANGE_ADMIN', 'RSO', 'STAFF')
  findOne(@Param('id') id: string) {
    return this.organizationsService.getOrganizationById(id);
  }

  @Put(':id')
  @Roles('RANGE_ADMIN')
  update(@Param('id') id: string, @Body() updateOrgDto: { name?: string; contactEmail?: string; contactPhone?: string }) {
    return this.organizationsService.updateOrganization(id, updateOrgDto);
  }
}
