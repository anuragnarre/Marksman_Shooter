// apps/api/src/suggestions/suggestions.controller.ts
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { SuggestionsService } from './suggestions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuggestionResult } from '@shooting-platform/shared-types';

@Controller('suggestions')
@UseGuards(JwtAuthGuard)
export class SuggestionsController {
  constructor(private readonly suggestionsService: SuggestionsService) {}

  @Get('session/:id')
  async getSessionSuggestions(
    @Param('id') id: string,
  ): Promise<SuggestionResult> {
    return this.suggestionsService.getSuggestions(id);
  }
}
