import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { FirestoreProvider } from '../../src/shared/firestore/firestore.provider';
import { VcsService } from '../../src/vcs/vcs.service';
import { setupTestApp } from '../setup';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let firestoreMock: jest.Mocked<FirestoreProvider>;
  let vcsServiceMock: jest.Mocked<VcsService>;
  let mockCollection: any;
  let mockDocRef: any;

  beforeAll(async () => {
    // Firestoreのモックを作成
    mockDocRef = {
      get: jest.fn().mockResolvedValue({ exists: true }),
      set: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
    };

    mockCollection = {
      doc: jest.fn().mockReturnValue(mockDocRef),
      where: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({
        empty: false,
        docs: [
          {
            id: 'user1',
            data: () => ({
              email: 'test@example.com',
              name: 'Test User',
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

    vcsServiceMock = {
      createOrUpdateUserVC: jest.fn().mockResolvedValue(undefined),
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

  describe('POST /api/v1/onpaku/users', () => {
    it('should create a new user successfully', () => {
      const createUserDto = {
        id: 'user123',
        email: 'test@example.com',
        family_name: '山田',
        first_name: '太郎',
        birth_year: 1990,
        gender: 'male',
        zip: '123-4567',
        prefecture: '東京都',
        address: '渋谷区',
        street: '1-2-3',
        tel: '03-1234-5678',
        management_programs: [
          {
            programId: 'program123',
            role: 'partner',
          },
        ],
      };

      return request(app.getHttpServer())
        .post('/api/v1/onpaku/users')
        .set('Authorization', 'Bearer onpaku-api')
        .send(createUserDto)
        .expect(201)
        .expect(() => {
          expect(firestoreMock.getFirestore().collection).toHaveBeenCalledWith(
            'users',
          );
          expect(mockCollection.doc).toHaveBeenCalledWith(createUserDto.email);
          expect(mockDocRef.set).toHaveBeenCalledWith(
            expect.objectContaining({
              onpakuUserId: createUserDto.id,
              familyName: createUserDto.family_name,
              firstName: createUserDto.first_name,
              birthYear: createUserDto.birth_year,
              gender: createUserDto.gender,
              zip: createUserDto.zip,
              prefecture: createUserDto.prefecture,
              address: createUserDto.address,
              street: createUserDto.street,
              tel: createUserDto.tel,
              managementPrograms: createUserDto.management_programs,
              createdAt: expect.any(Date),
            }),
          );
          expect(vcsServiceMock.createOrUpdateUserVC).toHaveBeenCalledWith(
            createUserDto.email,
            expect.objectContaining({
              id: createUserDto.id,
              familyName: createUserDto.family_name,
              firstName: createUserDto.first_name,
              birthYear: createUserDto.birth_year,
              gender: createUserDto.gender,
              zip: createUserDto.zip,
              prefecture: createUserDto.prefecture,
              address: createUserDto.address,
              street: createUserDto.street,
              tel: createUserDto.tel,
            }),
          );
        });
    });

    it('should return 400 when required fields are missing', () => {
      const invalidDto = {
        email: 'test@example.com',
        // 他の必須フィールドが欠けている
      };

      return request(app.getHttpServer())
        .post('/api/v1/onpaku/users')
        .set('Authorization', 'Bearer onpaku-api')
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('PATCH /api/v1/onpaku/users', () => {
    it('should update user successfully', () => {
      const updateUserDto = {
        id: 'user123',
        email: 'test@example.com',
        family_name: '山田',
        first_name: '次郎',
        management_programs: [
          {
            programId: 'program123',
            role: 'partner',
          },
        ],
      };

      // ユーザーが存在することをモック
      mockDocRef.get.mockResolvedValueOnce({ exists: true });

      return request(app.getHttpServer())
        .patch('/api/v1/onpaku/users')
        .set('Authorization', 'Bearer onpaku-api')
        .send(updateUserDto)
        .expect(200)
        .expect(() => {
          expect(firestoreMock.getFirestore().collection).toHaveBeenCalledWith(
            'users',
          );
          expect(mockCollection.doc).toHaveBeenCalledWith(updateUserDto.email);
          expect(mockDocRef.get).toHaveBeenCalled();
          expect(mockDocRef.update).toHaveBeenCalledWith(
            expect.objectContaining({
              familyName: updateUserDto.family_name,
              firstName: updateUserDto.first_name,
              managementPrograms: updateUserDto.management_programs,
            }),
          );
        });
    });

    it('should return 404 when user not found', () => {
      const updateUserDto = {
        id: 'nonexistent',
        email: 'nonexistent@example.com',
        family_name: '存在',
        first_name: 'しない',
      };

      // ユーザーが存在しないことをモック
      mockDocRef.get.mockResolvedValueOnce({ exists: false });

      return request(app.getHttpServer())
        .patch('/api/v1/onpaku/users')
        .set('Authorization', 'Bearer onpaku-api')
        .send(updateUserDto)
        .expect(404);
    });
  });
});
