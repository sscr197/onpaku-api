import { Test, TestingModule } from '@nestjs/testing';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { CustomLogger } from '../shared/logger/custom.logger';
import { ConfigService } from '@nestjs/config';
import { ApiKeyGuard } from '../shared/guards/api-key.guard';

describe('ReservationsController', () => {
  let controller: ReservationsController;
  let serviceMock: jest.Mocked<ReservationsService>;
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
      createReservation: jest.fn(),
    } as unknown as jest.Mocked<ReservationsService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReservationsController],
      providers: [
        {
          provide: ReservationsService,
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

    controller = module.get<ReservationsController>(ReservationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createReservation', () => {
    it('should create a reservation successfully', async () => {
      const createReservationDto: CreateReservationDto = {
        reservation_id: 'reservation1',
        user_id: 'user1',
        execution: {
          id: 'execution1',
          program_id: 'program1',
          start_time: '2024-04-01T10:00:00Z',
          end_time: '2024-04-01T12:00:00Z',
          capacity: 10,
          price: 1000,
        },
      };

      serviceMock.createReservation.mockResolvedValue(undefined);

      await controller.createReservation(createReservationDto);

      expect(serviceMock.createReservation).toHaveBeenCalledWith(
        createReservationDto,
      );
      expect(loggerMock.debug).toHaveBeenCalledWith(
        `Received request to create reservation: ${createReservationDto.reservation_id}`,
      );
    });

    it('should handle errors when creating reservation', async () => {
      const createReservationDto: CreateReservationDto = {
        reservation_id: 'reservation1',
        user_id: 'user1',
        execution: {
          id: 'execution1',
          program_id: 'program1',
          start_time: '2024-04-01T10:00:00Z',
          end_time: '2024-04-01T12:00:00Z',
          capacity: 10,
          price: 1000,
        },
      };

      const error = new Error('Service error');
      serviceMock.createReservation.mockRejectedValue(error);

      await expect(
        controller.createReservation(createReservationDto),
      ).rejects.toThrow(error);

      expect(loggerMock.error).toHaveBeenCalledWith(
        `Failed to create reservation: ${error.message}`,
        error.stack,
      );
    });
  });
});
