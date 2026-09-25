import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UpdatePreferenceDto } from './dto/update-preference.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  getUserNotifications(@Request() req: any) {
    return this.notificationsService.getUserNotifications(req.user.id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllAsRead(@Request() req: any) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  markAsRead(@Param('id') id: string, @Request() req: any) {
    return this.notificationsService.markAsRead(id, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  deleteNotification(@Param('id') id: string, @Request() req: any) {
    return this.notificationsService.deleteNotification(id, req.user.id);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  getPreferences(@Request() req: any) {
    return this.notificationsService.getPreferences(req.user.id);
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  updatePreferences(@Body() updateDto: UpdatePreferenceDto, @Request() req: any) {
    return this.notificationsService.updatePreferences(req.user.id, updateDto);
  }

  @Patch('device/register')
  @ApiOperation({ summary: 'Register a device for push notifications' })
  registerDevice(
    @Body('token') token: string,
    @Body('deviceOs') deviceOs: string,
    @Request() req: any,
  ) {
    // Assuming PushService is injected or accessible. 
    // It's better to expose this via NotificationsService.
    return this.notificationsService.registerDevice(req.user.id, token, deviceOs);
  }

  @Delete('device/:token')
  @ApiOperation({ summary: 'Unregister a device' })
  unregisterDevice(@Param('token') token: string) {
    return this.notificationsService.unregisterDevice(token);
  }
}
