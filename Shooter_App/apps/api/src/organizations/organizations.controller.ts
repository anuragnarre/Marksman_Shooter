import { Controller, Get, Post, Body, Param, Put, UseGuards, Req } from '@nestjs/common';
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
  create(@Req() req: any, @Body() createOrgDto: { name: string; type: string; description?: string }) {
    return this.organizationsService.createOrganization(req.user.id, createOrgDto);
  }

  @Get()
  @Roles('RANGE_ADMIN', 'RSO', 'STAFF')
  findAll(@Req() req: any) {
    return this.organizationsService.getOrganizationsByUser(req.user.id);
  }

  @Get(':id')
  @Roles('RANGE_ADMIN', 'RSO', 'STAFF')
  findOne(@Param('id') id: string) {
    return this.organizationsService.getOrganizationById(id);
  }

  @Put(':id')
  @Roles('RANGE_ADMIN')
  update(@Param('id') id: string, @Body() updateOrgDto: { name?: string; description?: string }) {
    return this.organizationsService.updateOrganization(id, updateOrgDto);
  }

  @Post(':id/ranges')
  @Roles('RANGE_ADMIN')
  registerRange(@Req() req: any, @Param('id') id: string, @Body() data: any) {
    return this.organizationsService.registerRange(id, req.user.id, data);
  }
}
