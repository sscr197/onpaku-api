import { Test, TestingModule } from '@nestjs/testing';
import { ProgramsController } from './programs.controller';
import { ProgramsService } from './programs.service';
import { CustomLogger } from '../shared/logger/custom.logger';
import { ConfigService } from '@nestjs/config';
import { ApiKeyGuard } from '../shared/guards/api-key.guard';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';

describe('ProgramsController', () => {
  let controller: ProgramsController;
  let serviceMock: jest.Mocked<ProgramsService>;
  let loggerMock: jest.Mocked<CustomLogger>;

  beforeEach(async () => {
    serviceMock = {
      createOrUpdateProgram: jest.fn(),
      updateProgram: jest.fn(),
      addPartnerUser: jest.fn(),
    } as unknown as jest.Mocked<ProgramsService>;

    loggerMock = {
      setContext: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
      log: jest.fn(),
      warn: jest.fn(),
      verbose: jest.fn(),
      fatal: jest.fn(),
      setLogLevels: jest.fn(),
      resetContext: jest.fn(),
      isLevelEnabled: jest.fn(),
    } as unknown as jest.Mocked<CustomLogger>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProgramsController],
      providers: [
        {
          provide: ProgramsService,
          useValue: serviceMock,
        },
        {
          provide: CustomLogger,
          useValue: loggerMock,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-api-key'),
          },
        },
        ApiKeyGuard,
      ],
    }).compile();

    controller = module.get<ProgramsController>(ProgramsController);

    // テストケースの前にロガーのモックをクリア
    loggerMock.debug.mockClear();
    loggerMock.error.mockClear();
    loggerMock.setContext.mockClear();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createOrUpdateProgram', () => {
    it('should create or update a program successfully', async () => {
      const createProgramDto: CreateProgramDto = {
        program: {
          id: 'program1',
          title: 'テストプログラム',
          sub_title: 'サブタイトル',
          number: 1,
          latitude: 35.6895,
          longitude: 139.6917,
          place_name: 'テスト会場',
          zip: '123-4567',
          prefecture: '東京都',
          address: '渋谷区',
          street: '1-1-1',
        },
        partner_users: [
          {
            email: 'partner1@example.com',
            role: 'owner',
          },
        ],
      };

      await controller.createOrUpdateProgram(createProgramDto);

      expect(serviceMock.createOrUpdateProgram).toHaveBeenCalledWith(
        createProgramDto,
      );
      expect(loggerMock.debug).toHaveBeenCalledWith(
        `Received request to create/update program: ${createProgramDto.program.id}`,
      );
    });

    it('should handle errors when creating/updating program', async () => {
      const createProgramDto: CreateProgramDto = {
        program: {
          id: 'program1',
          title: 'テストプログラム',
          sub_title: 'サブタイトル',
          number: 1,
          latitude: 35.6895,
          longitude: 139.6917,
          place_name: 'テスト会場',
          zip: '123-4567',
          prefecture: '東京都',
          address: '渋谷区',
          street: '1-1-1',
        },
        partner_users: [],
      };

      const error = new Error('Service error');
      serviceMock.createOrUpdateProgram.mockRejectedValue(error);

      await expect(
        controller.createOrUpdateProgram(createProgramDto),
      ).rejects.toThrow(error);

      expect(loggerMock.error).toHaveBeenCalledWith(
        `Failed to create/update program: ${error.message}`,
        error.stack,
      );
    });
  });

  describe('updateProgram', () => {
    it('should update a program successfully', async () => {
      const updateProgramDto: UpdateProgramDto = {
        id: 'program1',
        title: '更新後のタイトル',
        sub_title: '更新後のサブタイトル',
        number: 2,
        latitude: 35.0,
        longitude: 140.0,
        place_name: '更新後の会場',
        zip: '123-4567',
        prefecture: '更新後の都道府県',
        address: '更新後の市区町村',
        street: '更新後の番地',
        partner_users: [{ email: 'partner1@example.com', role: 'owner' }],
      };

      await controller.updateProgram(updateProgramDto);

      expect(serviceMock.updateProgram).toHaveBeenCalledWith(updateProgramDto);
      expect(loggerMock.debug).toHaveBeenCalledWith(
        `Received request to update program: ${updateProgramDto.id}`,
      );
    });

    it('should handle errors when updating program', async () => {
      const updateProgramDto: UpdateProgramDto = {
        id: 'program1',
        title: '更新後のタイトル',
      };

      const error = new Error('Service error');
      serviceMock.updateProgram.mockRejectedValue(error);

      await expect(controller.updateProgram(updateProgramDto)).rejects.toThrow(
        error,
      );

      expect(loggerMock.error).toHaveBeenCalledWith(
        `Failed to update program: ${error.message}`,
        error.stack,
      );
    });
  });
});
