import { SuggestionsService } from './suggestions.service';
import { JwtPayload, SuggestionResult } from '@shooting-platform/shared-types';
export declare class SuggestionsController {
    private readonly suggestionsService;
    constructor(suggestionsService: SuggestionsService);
    getSessionSuggestions(user: JwtPayload, id: string): Promise<SuggestionResult>;
}
