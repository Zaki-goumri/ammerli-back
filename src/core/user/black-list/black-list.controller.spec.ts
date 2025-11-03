import { Test, TestingModule } from '@nestjs/testing';
import { BlackListController } from './black-list.controller';

describe('BlackListController', () => {
  let controller: BlackListController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlackListController],
    }).compile();

    controller = module.get<BlackListController>(BlackListController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
