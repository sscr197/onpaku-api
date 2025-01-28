import { Test, TestingModule } from '@nestjs/testing';
import { VcsController } from './vcs.controller';

describe('VcsController', () => {
  let controller: VcsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VcsController],
    }).compile();

    controller = module.get<VcsController>(VcsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
