import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { FirestoreProvider } from '../../src/shared/firestore/firestore.provider';
import { VcsService } from '../../src/vcs/vcs.service';
import { setupTestApp } from '../setup';
import {
  CreateReservationDto,
  Execution,
} from '../../src/reservations/dto/create-reservation.dto';

describe('Reservations (e2e)', () => {
  let app: INestApplication;
  let firestoreMock: jest.Mocked<FirestoreProvider>;
  let mockCollection: any;

  beforeAll(async () => {
    // Firestoreのモックを作成
    mockCollection = {
      doc: jest.fn().mockReturnThis(),
      set: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      where: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({
        empty: false,
        docs: [
          {
            id: 'reservation1',
            data: () => ({
              program_id: 'program1',
              user_id: 'user1',
              status: 'pending',
              created_at: new Date(),
            }),
          },
        ],
      }),
    };

    const mockFirestore = {
      collection: jest.fn().mockReturnValue(mockCollection),
    };

    firestoreMock = {
      getFirestore: jest.fn().mockReturnValue(mockFirestore),
    } as any;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(FirestoreProvider)
      .useValue(firestoreMock)
      .compile();

    app = moduleFixture.createNestApplication();
    setupTestApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/onpaku/reservations', () => {
    it('should create a new reservation successfully', () => {
      const createReservationDto: CreateReservationDto = {
        reservation_id: 'reservation123',
        email: 'user1@example.com',
        execution: {
          id: 'execution123',
          program_id: 'program123',
          start_time: '2024-02-01T10:00:00+09:00',
          end_time: '2024-02-01T12:00:00+09:00',
          capacity: 10,
          price: 5000,
        } as Execution,
      };

      return request(app.getHttpServer())
        .post('/api/v1/onpaku/reservations')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .send(createReservationDto)
        .expect(201)
        .expect(() => {
          expect(firestoreMock.getFirestore().collection).toHaveBeenCalledWith(
            'reservations',
          );
          expect(mockCollection.set).toHaveBeenCalledWith(
            expect.objectContaining({
              executionId: createReservationDto.execution.id,
              programId: createReservationDto.execution.program_id,
              startTime: expect.any(Date),
              endTime: expect.any(Date),
              capacity: createReservationDto.execution.capacity,
              price: createReservationDto.execution.price,
            }),
          );
        });
    });

    it('should return 400 when required fields are missing', () => {
      const invalidDto: Partial<CreateReservationDto> = {
        reservation_id: 'reservation123',
      };

      return request(app.getHttpServer())
        .post('/api/v1/onpaku/reservations')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .send(invalidDto)
        .expect(400);
    });

    it('should handle Firestore errors', () => {
      const createReservationDto: CreateReservationDto = {
        reservation_id: 'reservation123',
        email: 'user1@example.com',
        execution: {
          id: 'execution123',
          program_id: 'program123',
          start_time: '2024-02-01T10:00:00+09:00',
          end_time: '2024-02-01T12:00:00+09:00',
          capacity: 10,
          price: 5000,
        } as Execution,
      };

      // ... rest of the test ...
    });
  });
});
