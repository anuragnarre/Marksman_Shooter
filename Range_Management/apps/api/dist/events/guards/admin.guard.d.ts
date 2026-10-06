import { CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class AdminGuard implements CanActivate {
    private config;
    private readonly adminEmails;
    constructor(config: ConfigService);
    canActivate(context: ExecutionContext): boolean;
}
