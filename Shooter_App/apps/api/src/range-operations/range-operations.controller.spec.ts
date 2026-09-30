import { Test, TestingModule } from '@nestjs/testing';
import { RangeOperationsController } from './range-operations.controller';

describe('RangeOperationsController', () => {
  let controller: RangeOperationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RangeOperationsController],
    }).compile();

    controller = module.get<RangeOperationsController>(RangeOperationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
