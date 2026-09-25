import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EquipmentService } from './equipment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';

@ApiTags('equipment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Get()
  @ApiOperation({ summary: 'Get all equipment for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Return all user equipment' })
  findAll(@Req() req: any) {
    return this.equipmentService.findAll(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new equipment entry' })
  @ApiResponse({ status: 201, description: 'Equipment successfully created' })
  create(@Req() req: any, @Body() dto: CreateEquipmentDto) {
    return this.equipmentService.create(req.user.id, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing equipment entry' })
  @ApiResponse({ status: 200, description: 'Equipment successfully updated' })
  update(@Param('id') id: string, @Req() req: any, @Body() dto: UpdateEquipmentDto) {
    return this.equipmentService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an equipment entry' })
  @ApiResponse({ status: 200, description: 'Equipment successfully deleted' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.equipmentService.remove(id, req.user.id);
  }

  @Post(':id/service-logs')
  @ApiOperation({ summary: 'Add a service log to equipment' })
  addServiceLog(@Param('id') id: string, @Body() data: any) {
    return this.equipmentService.addServiceLog(id, data);
  }

  @Get('ammo-lots')
  @ApiOperation({ summary: 'Get all ammo lots for user' })
  getAmmoLots(@Req() req: any) {
    return this.equipmentService.getAmmoLots(req.user.id);
  }

  @Post('ammo-lots')
  @ApiOperation({ summary: 'Create a new ammo lot' })
  addAmmoLot(@Req() req: any, @Body() data: any) {
    return this.equipmentService.addAmmoLot(req.user.id, data);
  }

  @Post('ammo-lots/:id/reloading-logs')
  @ApiOperation({ summary: 'Add a reloading log to an ammo lot' })
  addReloadingLog(@Param('id') id: string, @Body() data: any) {
    return this.equipmentService.addReloadingLog(id, data);
  }

  @Post(':id/ballistic-profiles')
  @ApiOperation({ summary: 'Add a ballistic profile to equipment' })
  addBallisticProfile(@Param('id') id: string, @Body() data: any) {
    return this.equipmentService.createBallisticProfile(id, data);
  }
}
