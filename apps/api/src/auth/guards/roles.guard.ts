// apps/api/src/auth/roles.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtPayload, UserRole } from '@shooting-platform/shared-types';

const ROLE_HIERARCHY: Partial<Record<UserRole, UserRole[]>> = {
  RANGE_ADMIN: ['RANGE_OPERATOR', 'RSO', 'STAFF', 'RANGE_ADMIN'],
  RANGE_OPERATOR: ['RSO', 'STAFF', 'RANGE_OPERATOR'],
  RSO: ['STAFF', 'RSO'],
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user: JwtPayload }>();
    const user = request.user;

    const userRoles = ROLE_HIERARCHY[user.role] || [user.role];
    const hasRole = requiredRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      throw new ForbiddenException(
        `This action requires one of these roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
