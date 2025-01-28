import { Test, TestingModule } from '@nestjs/testing';
import { VcsService } from './vcs.service';

describe('VcsService', () => {
  let service: VcsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VcsService],
    }).compile();

    service = module.get<VcsService>(VcsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
