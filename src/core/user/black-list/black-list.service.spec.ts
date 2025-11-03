import { Test, TestingModule } from '@nestjs/testing';
import { BlackListService } from './black-list.service';

describe('BlackListService', () => {
  let service: BlackListService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BlackListService],
    }).compile();

    service = module.get<BlackListService>(BlackListService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
