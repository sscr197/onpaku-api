import { Test, TestingModule } from '@nestjs/testing';
import { ReservationsService } from './reservations.service';
import { FirestoreProvider } from '../shared/firestore/firestore.provider';
import { VcsService } from '../vcs/vcs.service';
import { CustomLogger } from '../shared/logger/custom.logger';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { NotFoundException } from '@nestjs/common';

describe('ReservationsService', () => {
  let service: ReservationsService;
  let firestoreMock: jest.Mocked<FirestoreProvider>;
  let vcsServiceMock: jest.Mocked<VcsService>;
  let loggerMock: jest.Mocked<CustomLogger>;

  const docMock = {
    set: jest.fn().mockResolvedValue(undefined),
  };

  const whereMock = {
    get: jest.fn().mockResolvedValue({
      empty: false,
      docs: [{ id: 'test@example.com' }],
    }),
  };

  const collectionMock = {
    doc: jest.fn().mockReturnValue(docMock),
    where: jest.fn().mockReturnValue(whereMock),
  };

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

    firestoreMock = {
      getFirestore: jest.fn().mockReturnValue({
        collection: jest.fn().mockReturnValue(collectionMock),
      }),
    } as unknown as jest.Mocked<FirestoreProvider>;

    vcsServiceMock = {
      createEventVC: jest.fn(),
    } as unknown as jest.Mocked<VcsService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        {
          provide: FirestoreProvider,
          useValue: firestoreMock,
        },
        {
          provide: VcsService,
          useValue: vcsServiceMock,
        },
        {
          provide: CustomLogger,
          useValue: loggerMock,
        },
      ],
    }).compile();

    service = module.get<ReservationsService>(ReservationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createReservation', () => {
    it('should create a reservation and event VC successfully', async () => {
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

      whereMock.get.mockResolvedValueOnce({
        empty: false,
        docs: [{ id: 'test@example.com' }],
      });

      await service.createReservation(createReservationDto);

      expect(firestoreMock.getFirestore).toHaveBeenCalled();
      expect(collectionMock.doc).toHaveBeenCalled();
      expect(collectionMock.where).toHaveBeenCalled();
      expect(whereMock.get).toHaveBeenCalled();
      expect(vcsServiceMock.createEventVC).toHaveBeenCalled();
      expect(loggerMock.debug).toHaveBeenCalledWith(
        `Creating reservation for user: ${createReservationDto.user_id}`,
      );
    });

    it('should throw NotFoundException when user is not found', async () => {
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

      whereMock.get.mockResolvedValueOnce({
        empty: true,
        docs: [],
      });

      await expect(
        service.createReservation(createReservationDto),
      ).rejects.toThrow(NotFoundException);

      expect(loggerMock.error).toHaveBeenCalledWith(
        `User not found: ${createReservationDto.user_id}`,
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

      whereMock.get.mockResolvedValueOnce({
        empty: false,
        docs: [{ id: 'test@example.com' }],
      });

      const error = new Error('Firestore error');
      docMock.set.mockRejectedValueOnce(error);

      await expect(
        service.createReservation(createReservationDto),
      ).rejects.toThrow(error);

      expect(loggerMock.error).toHaveBeenCalledWith(
        'Failed to create reservation: Firestore error',
        error.stack,
      );
    });
  });
});
