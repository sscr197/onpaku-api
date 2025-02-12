import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { FirestoreProvider } from '../../src/shared/firestore/firestore.provider';
import { VcsService } from '../../src/vcs/vcs.service';
import { setupTestApp } from '../setup';
import {
  CreateProgramDto,
  Program,
  PartnerUser,
} from '../../src/programs/dto/create-program.dto';
import { ProgramRef } from '../../src/users/dto/program-ref';

describe('Programs (e2e)', () => {
  let app: INestApplication;
  let firestoreMock: jest.Mocked<FirestoreProvider>;
  let vcsServiceMock: jest.Mocked<VcsService>;
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
            id: 'program1',
            data: () => ({
              title: 'テストプログラム',
              partnerUsers: [],
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

    // VcsServiceのモックを作成
    vcsServiceMock = {
      createOrUpdateUserVC: jest.fn().mockResolvedValue(undefined),
      createPartnerVC: jest.fn().mockResolvedValue(undefined),
    } as any;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(FirestoreProvider)
      .useValue(firestoreMock)
      .overrideProvider(VcsService)
      .useValue(vcsServiceMock)
      .compile();

    app = moduleFixture.createNestApplication();
    setupTestApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/onpaku/programs', () => {
    it('should create a new program successfully', () => {
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
            email: 'partner@example.com',
            role: 'owner',
          } as PartnerUser,
        ],
      };

      return request(app.getHttpServer())
        .post('/api/v1/onpaku/programs')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .send(createProgramDto)
        .expect(201)
        .expect(() => {
          expect(firestoreMock.getFirestore().collection).toHaveBeenCalledWith(
            'programs',
          );
          expect(mockCollection.doc).toHaveBeenCalledWith(
            createProgramDto.program.id,
          );
          expect(mockCollection.set).toHaveBeenCalled();
          expect(vcsServiceMock.createPartnerVC).toHaveBeenCalledWith(
            createProgramDto.partner_users[0].email,
            expect.objectContaining({
              id: createProgramDto.program.id,
              title: createProgramDto.program.title,
              role: createProgramDto.partner_users[0].role,
              placeName: createProgramDto.program.place_name,
              prefecture: createProgramDto.program.prefecture,
              address: createProgramDto.program.address,
            }),
          );
        });
    });

    it('should return 400 when program.id is missing', () => {
      const invalidDto = {
        program: {
          title: 'テストプログラム',
        } as Partial<Program>,
        partner_users: [],
      } as Partial<CreateProgramDto>;

      return request(app.getHttpServer())
        .post('/api/v1/onpaku/programs')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .send(invalidDto)
        .expect(400);
    });

    it('should handle Firestore errors', () => {
      const error = new Error('Firestore error');
      mockCollection.doc.mockReturnValueOnce({
        set: jest.fn().mockRejectedValueOnce(error),
      });

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
            email: 'partner@example.com',
            role: 'owner',
          } as PartnerUser,
        ],
      };

      return request(app.getHttpServer())
        .post('/api/v1/onpaku/programs')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .send(createProgramDto)
        .expect(500);
    });
  });

  describe('PATCH /api/v1/onpaku/programs', () => {
    beforeEach(() => {
      // 各テストの前にモックをリセット
      jest.clearAllMocks();

      // デフォルトのモックレスポンスを設定
      mockCollection.doc.mockReturnValue({
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            title: 'テストプログラム',
            subTitle: 'サブタイトル',
            number: 1,
            latitude: 35.6895,
            longitude: 139.6917,
            placeName: 'テスト会場',
            zip: '123-4567',
            prefecture: '東京都',
            address: '渋谷区',
            street: '1-1-1',
            partnerUsers: [],
          }),
        }),
        update: jest.fn().mockResolvedValue(undefined),
      });
    });

    it('should update an existing program successfully', () => {
      const updateProgramDto = {
        program: {
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
        },
        partner_users: [
          {
            email: 'partner@example.com',
            role: 'owner',
          } as PartnerUser,
        ],
      };

      return request(app.getHttpServer())
        .patch('/api/v1/onpaku/programs')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .send(updateProgramDto)
        .expect(200)
        .expect(() => {
          expect(firestoreMock.getFirestore().collection).toHaveBeenCalledWith(
            'programs',
          );
          expect(mockCollection.doc).toHaveBeenCalledWith(
            updateProgramDto.program.id,
          );
          expect(mockCollection.doc().update).toHaveBeenCalled();

          if (updateProgramDto.partner_users?.length) {
            expect(vcsServiceMock.createPartnerVC).toHaveBeenCalledWith(
              updateProgramDto.partner_users[0].email,
              expect.objectContaining({
                id: updateProgramDto.program.id,
                title: updateProgramDto.program.title,
                role: updateProgramDto.partner_users[0].role,
                placeName: updateProgramDto.program.place_name,
                prefecture: updateProgramDto.program.prefecture,
                address: updateProgramDto.program.address,
              }),
            );
          }
        });
    });

    it('should return 404 when program does not exist', () => {
      mockCollection.doc.mockReturnValue({
        get: jest.fn().mockResolvedValue({
          exists: false,
        }),
      });

      const updateProgramDto = {
        program: {
          id: 'non-existent',

          title: '更新後のタイトル',
        },
      };

      return request(app.getHttpServer())
        .patch('/api/v1/onpaku/programs')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .send(updateProgramDto)
        .expect(404);
    });

    it('should return 400 when request body is invalid', () => {
      const invalidDto = {
        // idが必須なのに欠けている
        title: '更新後のタイトル',
      };

      return request(app.getHttpServer())
        .patch('/api/v1/onpaku/programs')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .send(invalidDto)
        .expect(400);
    });

    it('should update only specified fields', () => {
      const updateProgramDto = {
        program: {
          id: 'program1',
          title: '更新後のタイトル',
        },
      };

      return request(app.getHttpServer())
        .patch('/api/v1/onpaku/programs')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .send(updateProgramDto)
        .expect(200)
        .expect(() => {
          const updateCall = mockCollection.doc().update.mock.calls[0][0];
          expect(updateCall).toHaveProperty('title', '更新後のタイトル');
          expect(updateCall).toHaveProperty('updatedAt');
          // 未指定のフィールドが更新データに含まれていないことを確認
          expect(updateCall).not.toHaveProperty('subTitle');
          expect(updateCall).not.toHaveProperty('number');
          expect(updateCall).not.toHaveProperty('latitude');
          expect(updateCall).not.toHaveProperty('longitude');
          expect(updateCall).not.toHaveProperty('placeName');
          expect(updateCall).not.toHaveProperty('zip');
          expect(updateCall).not.toHaveProperty('prefecture');
          expect(updateCall).not.toHaveProperty('address');
          expect(updateCall).not.toHaveProperty('street');
          expect(updateCall).not.toHaveProperty('partnerUsers');
        });
    });

    it('should handle Firestore errors', () => {
      const error = new Error('Firestore error');
      mockCollection.doc.mockReturnValue({
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            title: 'テストプログラム',
          }),
        }),
        update: jest.fn().mockRejectedValue(error),
      });

      const updateProgramDto = {
        program: {
          id: 'program1',
          title: '更新後のタイトル',
        },
      };

      return request(app.getHttpServer())
        .patch('/api/v1/onpaku/programs')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .send(updateProgramDto)
        .expect(500);
    });
  });
});
