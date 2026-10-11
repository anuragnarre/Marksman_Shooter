import { Controller, Get, Post, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BallisticsService } from './ballistics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateBallisticsDto } from './dto/create-ballistics.dto';

@ApiTags('ballistics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ballistics')
export class BallisticsController {
  constructor(private readonly ballisticsService: BallisticsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all ballistic profiles' })
  @ApiResponse({ status: 200, description: 'List of ballistic profiles' })
  findAll(@Req() req: any) {
    return this.ballisticsService.findAll(req.user.id);
  }

  @Post('calculate')
  @ApiOperation({ summary: 'Calculate ballistic trajectory and save profile' })
  @ApiResponse({ status: 201, description: 'Calculated trajectory and saved profile' })
  calculate(@Req() req: any, @Body() dto: CreateBallisticsDto) {
    return this.ballisticsService.calculate(req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a ballistic profile' })
  @ApiResponse({ status: 200, description: 'Profile successfully deleted' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.ballisticsService.remove(id, req.user.id);
  }
}
