// apps/api/src/suggestions/suggestions.controller.ts
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { SuggestionsService } from './suggestions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtPayload, SuggestionResult } from '@shooting-platform/shared-types';

@Controller('suggestions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SuggestionsController {
  constructor(private readonly suggestionsService: SuggestionsService) {}

  @Get('session/:id')
  @Roles('SHOOTER', 'COACH')
  async getSessionSuggestions(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<SuggestionResult> {
    return this.suggestionsService.getSuggestionsForUser(id, user.sub, user.role);
  }
}
