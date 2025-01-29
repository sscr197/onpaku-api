import { Test, TestingModule } from '@nestjs/testing';
import { ReservationsService } from './reservations.service';
import { FirestoreProvider } from '../shared/firestore/firestore.provider';
import { VcsService } from '../vcs/vcs.service';
import { CustomLogger } from '../shared/logger/custom.logger';
import { CreateReservationDto } from './dto/create-reservation.dto';

describe('ReservationsService', () => {
  let service: ReservationsService;
  let firestoreMock: jest.Mocked<FirestoreProvider>;
  let vcsServiceMock: jest.Mocked<VcsService>;
  let loggerMock: jest.Mocked<CustomLogger>;

  const docMock = {
    set: jest.fn().mockResolvedValue(undefined),
  };

  const collectionMock = {
    doc: jest.fn().mockReturnValue(docMock),
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
        email: 'user1@example.com',
        execution: {
          id: 'execution1',
          program_id: 'program1',
          start_time: '2024-04-01T10:00:00Z',
          end_time: '2024-04-01T12:00:00Z',
          capacity: 10,
          price: 1000,
        },
      };

      await service.createReservation(createReservationDto);

      expect(firestoreMock.getFirestore).toHaveBeenCalled();
      expect(collectionMock.doc).toHaveBeenCalledWith(
        createReservationDto.reservation_id,
      );
      expect(docMock.set).toHaveBeenCalledWith({
        userEmail: createReservationDto.email,
        executionId: createReservationDto.execution.id,
        programId: createReservationDto.execution.program_id,
        startTime: expect.any(Date),
        endTime: expect.any(Date),
        capacity: createReservationDto.execution.capacity,
        price: createReservationDto.execution.price,
        createdAt: expect.any(Date),
      });
      expect(vcsServiceMock.createEventVC).toHaveBeenCalledWith(
        createReservationDto.email,
        {
          reservationId: createReservationDto.reservation_id,
          programId: createReservationDto.execution.program_id,
          startTime: createReservationDto.execution.start_time,
          endTime: createReservationDto.execution.end_time,
          price: createReservationDto.execution.price,
        },
      );
      expect(loggerMock.debug).toHaveBeenCalledWith(
        `Creating reservation for user: ${createReservationDto.email}`,
      );
    });

    it('should handle errors when creating reservation', async () => {
      const createReservationDto: CreateReservationDto = {
        reservation_id: 'reservation1',
        email: 'user1@example.com',
        execution: {
          id: 'execution1',
          program_id: 'program1',
          start_time: '2024-04-01T10:00:00Z',
          end_time: '2024-04-01T12:00:00Z',
          capacity: 10,
          price: 1000,
        },
      };

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
