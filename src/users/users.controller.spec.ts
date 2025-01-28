import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CustomLogger } from '../shared/logger/custom.logger';
import { ConfigService } from '@nestjs/config';
import { ApiKeyGuard } from '../shared/guards/api-key.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let serviceMock: jest.Mocked<UsersService>;
  let loggerMock: jest.Mocked<CustomLogger>;

  beforeEach(async () => {
    loggerMock = {
      debug: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      verbose: jest.fn(),
      log: jest.fn(),
      fatal: jest.fn(),
      setLogLevels: jest.fn(),
      resetContext: jest.fn(),
      isLevelEnabled: jest.fn(),
      setContext: jest.fn(),
    } as unknown as jest.Mocked<CustomLogger>;

    serviceMock = {
      createUser: jest.fn(),
      updateUser: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
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

    controller = module.get<UsersController>(UsersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      const createUserDto: CreateUserDto = {
        id: 'user1',
        email: 'test@example.com',
        family_name: '山田',
        first_name: '太郎',
        birth_year: 1990,
        gender: '男性',
        zip: '100-0001',
        prefecture: '東京都',
        address: '千代田区',
        street: '1-1-1',
        tel: '03-1234-5678',
        management_programs: [],
      };

      serviceMock.createUser.mockResolvedValue(undefined);

      await controller.createUser(createUserDto);

      expect(serviceMock.createUser).toHaveBeenCalledWith(createUserDto);
      expect(loggerMock.debug).toHaveBeenCalledWith(
        `Received request to create user: ${createUserDto.email}`,
      );
    });

    it('should handle errors when creating user', async () => {
      const createUserDto: CreateUserDto = {
        id: 'user1',
        email: 'test@example.com',
        family_name: '山田',
        first_name: '太郎',
        birth_year: 1990,
        gender: '男性',
        zip: '100-0001',
        prefecture: '東京都',
        address: '千代田区',
        street: '1-1-1',
        tel: '03-1234-5678',
        management_programs: [],
      };
      const error = new Error('Service error');

      serviceMock.createUser.mockRejectedValue(error);

      await expect(controller.createUser(createUserDto)).rejects.toThrow(error);

      expect(loggerMock.error).toHaveBeenCalledWith(
        `Failed to create user: ${error.message}`,
        error.stack,
      );
    });
  });

  describe('updateUser', () => {
    it('should update a user successfully', async () => {
      const updateUserDto: UpdateUserDto = {
        id: 'user1',
        email: 'test@example.com',
        family_name: '山田',
        first_name: '太郎',
        management_programs: [],
      };

      serviceMock.updateUser.mockResolvedValue(undefined);

      await controller.updateUser(updateUserDto);

      expect(serviceMock.updateUser).toHaveBeenCalledWith(updateUserDto);
      expect(loggerMock.debug).toHaveBeenCalledWith(
        `Received request to update user: ${updateUserDto.email}`,
      );
    });

    it('should handle errors when updating user', async () => {
      const updateUserDto: UpdateUserDto = {
        id: 'user1',
        email: 'test@example.com',
        family_name: '山田',
        first_name: '太郎',
        management_programs: [],
      };
      const error = new Error('Service error');

      serviceMock.updateUser.mockRejectedValue(error);

      await expect(controller.updateUser(updateUserDto)).rejects.toThrow(error);

      expect(loggerMock.error).toHaveBeenCalledWith(
        `Failed to update user: ${error.message}`,
        error.stack,
      );
    });
  });
});
