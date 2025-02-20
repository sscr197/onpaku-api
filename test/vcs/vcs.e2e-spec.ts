import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { FirestoreProvider } from '../../src/shared/firestore/firestore.provider';
import { setupTestApp } from '../setup';
import { VCStatus, VCType } from '../../src/vcs/dto/vc-data.dto';

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
              userEmail: 'user@example.com',
              type: VCType.User,
              status: VCStatus.Pending,
              vcData: {
                onpakuUserId: 'user1',
                familyName: '山田',
                firstName: '太郎',
              },
              issuedAt: {
                toDate: () => new Date(),
              },
            }),
          },
        ],
      }),
    };

    // ユーザー情報のモックを追加
    const mockUserDoc = {
      exists: true,
      data: () => ({
        onpakuUserId: 'user1',
        familyName: '山田',
        firstName: '太郎',
      }),
    };

    const mockFirestore = {
      collection: jest.fn().mockImplementation((collectionName) => {
        if (collectionName === 'users') {
          return {
            doc: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue(mockUserDoc),
            }),
          };
        }
        return mockCollection;
      }),
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
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                documentId: 'vc1',
                email: 'user@example.com',
                type: 'user',
                status: VCStatus.Pending,
                vcData: expect.objectContaining({
                  type: 'OnpakuUser',
                  onpakuUserId: 'user1',
                  familyName: '山田',
                  firstName: '太郎',
                }),
              }),
            ]),
          );
        });
    });

    it('should return 400 when email is missing', () => {
      return request(app.getHttpServer())
        .get('/api/v1/onpaku/vcs/pending')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
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
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual([]);
        });
    });
  });

  describe('PATCH /api/v1/onpaku/vcs/status', () => {
    it('should update VC status successfully', () => {
      const documentId = 'vc1';
      const status = VCStatus.Completed;

      return request(app.getHttpServer())
        .patch('/api/v1/onpaku/vcs/status')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .send({ documentId, status })
        .expect(200);
    });

    it('should return 400 when documentId is missing', () => {
      return request(app.getHttpServer())
        .patch('/api/v1/onpaku/vcs/status')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .send({ status: VCStatus.Completed })
        .expect(400);
    });

    it('should return 400 when status is invalid', () => {
      return request(app.getHttpServer())
        .patch('/api/v1/onpaku/vcs/status')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .send({ documentId: 'vc1', status: 'invalid_status' })
        .expect(400);
    });

    it('should handle Firestore errors', () => {
      mockCollection.update.mockRejectedValueOnce(new Error('Firestore error'));

      return request(app.getHttpServer())
        .patch('/api/v1/onpaku/vcs/status')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .send({ documentId: 'vc1', status: VCStatus.Completed })
        .expect(500);
    });
  });
});
