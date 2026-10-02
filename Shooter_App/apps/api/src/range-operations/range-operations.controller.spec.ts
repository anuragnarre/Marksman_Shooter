import { Test, TestingModule } from '@nestjs/testing';
import { RangeOperationsController } from './range-operations.controller';
import { RangeOperationsService } from './range-operations.service';

describe('RangeOperationsController', () => {
  let controller: RangeOperationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RangeOperationsController],
      providers: [
        {
          provide: RangeOperationsService,
          useValue: {}
        }
      ]
    }).compile();

    controller = module.get<RangeOperationsController>(RangeOperationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
