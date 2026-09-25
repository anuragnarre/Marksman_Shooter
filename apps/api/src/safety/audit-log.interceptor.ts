import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, user, body, ip } = req;
    
    // Only log mutations
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle().pipe(
        tap(async (responseBody) => {
          try {
            await this.prisma.auditLog.create({
              data: {
                userId: user?.sub || 'anonymous',
                action: method,
                resourceType: url.split('/')[1] || 'unknown',
                resourceId: req.params.id || 'N/A',
                beforeData: {}, // Ideally, we'd fetch this before modification, but this is a simple append-only log
                afterData: responseBody || body,
                ipAddress: ip,
                userAgent: req.headers['user-agent'],
              },
            });
          } catch (error) {
            console.error('AuditLog Error:', error);
          }
        }),
      );
    }
    return next.handle();
  }
}
