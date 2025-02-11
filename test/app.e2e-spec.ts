import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { FirestoreProvider } from '../src/shared/firestore/firestore.provider';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(FirestoreProvider)
      .useValue({
        onModuleInit: jest.fn(),
        getFirestore: jest.fn().mockReturnValue({
          collection: jest.fn().mockReturnValue({
            doc: jest.fn().mockReturnThis(),
            get: jest
              .fn()
              .mockResolvedValue({ exists: true, data: () => ({}) }),
          }),
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World! v3');
  });
});
