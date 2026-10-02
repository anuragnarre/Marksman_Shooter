import { Test, TestingModule } from '@nestjs/testing';
import { TelemetryGateway } from './telemetry.gateway';
import { PrismaService } from '../../prisma/prisma.service';

describe('TelemetryGateway', () => {
  let gateway: TelemetryGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelemetryGateway,
        {
          provide: PrismaService,
          useValue: {},
        }
      ],
    }).compile();

    gateway = module.get<TelemetryGateway>(TelemetryGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
