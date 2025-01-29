import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { FirestoreProvider } from '../../src/shared/firestore/firestore.provider';
import { setupTestApp } from '../setup';

describe('VCs (e2e)', () => {
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
            id: 'vc1',
            data: () => ({
              email: 'user@example.com',
              program_id: 'program1',
              status: 'pending',
              createdAt: {
                toDate: () => new Date(),
              },
              issuedAt: {
                toDate: () => new Date(),
              },
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

  describe('GET /api/v1/onpaku/vcs/pending', () => {
    it('should get pending VCs by email', () => {
      const email = 'user@example.com';

      return request(app.getHttpServer())
        .get('/api/v1/onpaku/vcs/pending')
        .query({ email })
        .set('Authorization', 'Bearer onpaku-api')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                email: 'user@example.com',
                program_id: 'program1',
                status: 'pending',
              }),
            ]),
          );
        });
    });

    it('should return 400 when email is missing', () => {
      return request(app.getHttpServer())
        .get('/api/v1/onpaku/vcs/pending')
        .set('Authorization', 'Bearer onpaku-api')
        .expect(400);
    });

    it('should return empty array when no pending VCs found', () => {
      mockCollection.get.mockResolvedValueOnce({
        empty: true,
        docs: [],
      });

      return request(app.getHttpServer())
        .get('/api/v1/onpaku/vcs/pending')
        .query({ email: 'nonexistent@example.com' })
        .set('Authorization', 'Bearer onpaku-api')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual([]);
        });
    });
  });

  describe('PATCH /api/v1/onpaku/vcs/activate', () => {
    it('should activate VC successfully', () => {
      const vcId = 'vc1';

      return request(app.getHttpServer())
        .patch('/api/v1/onpaku/vcs/activate')
        .set('Authorization', 'Bearer onpaku-api')
        .send({ vcId })
        .expect(200);
    });

    it('should return 400 when vcId is missing', () => {
      return request(app.getHttpServer())
        .patch('/api/v1/onpaku/vcs/activate')
        .set('Authorization', 'Bearer onpaku-api')
        .send({})
        .expect(400);
    });
  });

  describe('PATCH /api/v1/onpaku/vcs/revoke', () => {
    it('should revoke VC successfully', () => {
      const vcId = 'vc1';

      return request(app.getHttpServer())
        .patch('/api/v1/onpaku/vcs/revoke')
        .set('Authorization', 'Bearer onpaku-api')
        .send({ vcId })
        .expect(200);
    });

    it('should return 400 when vcId is missing', () => {
      return request(app.getHttpServer())
        .patch('/api/v1/onpaku/vcs/revoke')
        .set('Authorization', 'Bearer onpaku-api')
        .send({})
        .expect(400);
    });
  });
});
