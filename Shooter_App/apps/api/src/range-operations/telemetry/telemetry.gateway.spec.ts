import { Test, TestingModule } from '@nestjs/testing';
import { TelemetryGateway } from './telemetry.gateway';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('TelemetryGateway', () => {
  let gateway: TelemetryGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelemetryGateway,
        {
          provide: PrismaService,
          useValue: {}
        },
        {
          provide: JwtService,
          useValue: {}
        },
        {
          provide: ConfigService,
          useValue: {}
        }
      ],
    }).compile();

    gateway = module.get<TelemetryGateway>(TelemetryGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
