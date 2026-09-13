import { Test, TestingModule } from '@nestjs/testing';
import { RangeOperationsService } from './range-operations.service';

describe('RangeOperationsService', () => {
  let service: RangeOperationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RangeOperationsService],
    }).compile();

    service = module.get<RangeOperationsService>(RangeOperationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
