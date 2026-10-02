import { Test, TestingModule } from '@nestjs/testing';
import { RangeOperationsService } from './range-operations.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RangeOperationsService', () => {
  let service: RangeOperationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RangeOperationsService,
        {
          provide: PrismaService,
          useValue: {}
        },
        {
          provide: 'BullQueue_range-telemetry',
          useValue: {}
        }
      ],
    }).compile();

    service = module.get<RangeOperationsService>(RangeOperationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
