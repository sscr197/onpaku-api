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
});
