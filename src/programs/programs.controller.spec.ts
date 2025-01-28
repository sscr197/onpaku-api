import { Test, TestingModule } from '@nestjs/testing';
import { ProgramsController } from './programs.controller';
import { ProgramsService } from './programs.service';
import { CustomLogger } from '../shared/logger/custom.logger';
import { ConfigService } from '@nestjs/config';
import { ApiKeyGuard } from '../shared/guards/api-key.guard';
import { CreateProgramDto } from './dto/create-program.dto';

describe('ProgramsController', () => {
  let controller: ProgramsController;
  let serviceMock: jest.Mocked<ProgramsService>;
  let loggerMock: jest.Mocked<CustomLogger>;

  beforeEach(async () => {
    serviceMock = {
      createOrUpdateProgram: jest.fn(),
      firestore: {} as any,
      logger: {} as any,
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
          title: 'Test Program',
          sub_title: 'Test Subtitle',
          number: 1,
          latitude: 35.6895,
          longitude: 139.6917,
          place_name: 'Test Place',
          zip: '123-4567',
          prefecture: 'Tokyo',
          address: 'Shibuya',
          street: '1-1-1',
        },
        partner_users: [],
      };

      serviceMock.createOrUpdateProgram.mockResolvedValue(undefined);

      await controller.createOrUpdateProgram(createProgramDto);

      expect(serviceMock.createOrUpdateProgram).toHaveBeenCalledWith(
        createProgramDto,
      );
      expect(loggerMock.debug).toHaveBeenCalledWith(
        `Received request to create/update program: ${createProgramDto.program.id}`,
      );
    });

    it('should handle errors when creating or updating program', async () => {
      const createProgramDto: CreateProgramDto = {
        program: {
          id: 'program1',
          title: 'Test Program',
          sub_title: 'Test Subtitle',
          number: 1,
          latitude: 35.6895,
          longitude: 139.6917,
          place_name: 'Test Place',
          zip: '123-4567',
          prefecture: 'Tokyo',
          address: 'Shibuya',
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
});
