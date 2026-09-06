import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RangesService } from './ranges.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateRangeDto } from './dto/create-range.dto';
import { UpdateRangeDto } from './dto/update-range.dto';

@ApiTags('ranges')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ranges')
export class RangesController {
  constructor(private readonly rangesService: RangesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all ranges accessible by the user' })
  @ApiResponse({ status: 200, description: 'List of ranges' })
  findAll(@Req() req: any) {
    return this.rangesService.findAll(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new range location' })
  @ApiResponse({ status: 201, description: 'Range successfully created' })
  create(@Req() req: any, @Body() dto: CreateRangeDto) {
    return this.rangesService.create(req.user.id, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing range location' })
  @ApiResponse({ status: 200, description: 'Range successfully updated' })
  update(@Param('id') id: string, @Req() req: any, @Body() dto: UpdateRangeDto) {
    return this.rangesService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a range location' })
  @ApiResponse({ status: 200, description: 'Range successfully deleted' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.rangesService.remove(id, req.user.id);
  }
}
