import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '@shooting-platform/shared-types';

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly adminEmails: Set<string>;

  constructor(private config: ConfigService) {
    const raw = this.config.get<string>('ADMIN_EMAILS', '');
    this.adminEmails = new Set(
      raw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean),
    );
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ user: JwtPayload }>();
    const user = request.user;

    if (!this.adminEmails.has(user.email.toLowerCase())) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
