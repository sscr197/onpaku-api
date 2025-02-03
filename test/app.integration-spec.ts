// test/integration/e2e.integration-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
// supertest でHTTPリクエストを投げる
import * as request from 'supertest';

import { CreateUserDto } from '../src/users/dto/create-user.dto';
import { UpdateUserDto } from '../src/users/dto/update-user.dto';
import { CreateProgramDto } from '../src/programs/dto/create-program.dto';
import { CreateReservationDto } from '../src/reservations/dto/create-reservation.dto';
import { VCDataDto, VCType, VCStatus } from '../src/vcs/dto/vc-data.dto';
import { ValidationPipe } from '@nestjs/common';
import { FirestoreProvider } from '../src/shared/firestore/firestore.provider';

// テストのタイムアウトを30秒に延長
jest.setTimeout(30000);

describe('IntegrationE2E', () => {
  let app: INestApplication;
  let firestoreProvider: FirestoreProvider;

  // テストデータの定義
  const TEST_USERS = {
    A: {
      id: 'user-a-123',
      email: 'user-a@example.com',
      family_name: '山田',
      first_name: '一郎',
      birth_year: 1980,
      gender: 'male',
      zip: '123-4567',
      prefecture: '東京都',
      address: '渋谷区',
      street: '1-2-3',
      tel: '03-1111-2222',
    },
    B: {
      id: 'user-b-456',
      email: 'user-b@example.com',
      family_name: '鈴木',
      first_name: '二郎',
      birth_year: 1985,
      gender: 'male',
      zip: '234-5678',
      prefecture: '東京都',
      address: '新宿区',
      street: '4-5-6',
      tel: '03-2222-3333',
    },
    C: {
      id: 'user-c-789',
      email: 'user-c@example.com',
      family_name: '佐藤',
      first_name: '三郎',
      birth_year: 1990,
      gender: 'male',
      zip: '345-6789',
      prefecture: '東京都',
      address: '品川区',
      street: '7-8-9',
      tel: '03-3333-4444',
    },
  };

  const TEST_PROGRAMS = {
    A: {
      id: 'program-a-123',
      title: 'プログラムA',
      sub_title: 'サブタイトルA',
      number: 1,
      latitude: 35.6895,
      longitude: 139.6917,
      place_name: '会場A',
      zip: '123-4567',
      prefecture: '東京都',
      address: '渋谷区',
      street: '1-1-1',
    },
    B: {
      id: 'program-b-456',
      title: 'プログラムB',
      sub_title: 'サブタイトルB',
      number: 2,
      latitude: 35.6895,
      longitude: 139.6917,
      place_name: '会場B',
      zip: '234-5678',
      prefecture: '東京都',
      address: '新宿区',
      street: '2-2-2',
    },
  };

  beforeAll(async () => {
    // Nestのモジュール起動 (AppModule)
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    // Nestアプリ生成（本番と同じ設定を適用）
    app = moduleFixture.createNestApplication();

    // バリデーションパイプの設定
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();

    // FirestoreProviderを取得
    firestoreProvider = app.get(FirestoreProvider);
  });

  afterAll(async () => {
    await app.close();
    await new Promise((resolve) => setTimeout(resolve, 500));
  });

  describe('ユーザー登録とプログラム管理フロー', () => {
    it('1) ユーザーAを登録', async () => {
      const payload: CreateUserDto = {
        ...TEST_USERS.A,
        management_programs: [],
      };

      await request(app.getHttpServer())
        .post('/api/v1/onpaku/users')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .send(payload)
        .expect(201);

      // ユーザーの確認
      const docUser = await firestoreProvider
        .getFirestore()
        .collection('users')
        .doc(TEST_USERS.A.email)
        .get();
      expect(docUser.exists).toBe(true);

      // VCの確認
      const resVC = await request(app.getHttpServer())
        .get('/api/v1/onpaku/vcs/pending')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .query({ email: TEST_USERS.A.email })
        .expect(200);

      const vcs = resVC.body as VCDataDto[];
      expect(vcs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: VCType.User,
            status: VCStatus.Pending,
          }),
        ]),
      );
    });

    it('2) プログラムAを登録（パートナー：ユーザーA）', async () => {
      const createProgramDto: CreateProgramDto = {
        program: TEST_PROGRAMS.A,
        partner_users: [
          {
            email: TEST_USERS.A.email,
            role: 'owner',
          },
        ],
      };

      await request(app.getHttpServer())
        .post('/api/v1/onpaku/programs')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .send(createProgramDto)
        .expect(201);

      // プログラムの確認
      const docProgram = await firestoreProvider
        .getFirestore()
        .collection('programs')
        .doc(TEST_PROGRAMS.A.id)
        .get();
      expect(docProgram.exists).toBe(true);

      // パートナーVCの確認
      const resVC = await request(app.getHttpServer())
        .get('/api/v1/onpaku/vcs/pending')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .query({ email: TEST_USERS.A.email })
        .expect(200);

      const vcs = resVC.body as VCDataDto[];
      expect(vcs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: VCType.User,
            status: VCStatus.Pending,
          }),
          expect.objectContaining({
            type: VCType.Partner,
            status: VCStatus.Pending,
          }),
        ]),
      );
    });

    it('3) プログラムBを登録（パートナーなし）', async () => {
      const createProgramDto: CreateProgramDto = {
        program: TEST_PROGRAMS.B,
        partner_users: [],
      };

      await request(app.getHttpServer())
        .post('/api/v1/onpaku/programs')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .send(createProgramDto)
        .expect(201);

      const docProgram = await firestoreProvider
        .getFirestore()
        .collection('programs')
        .doc(TEST_PROGRAMS.B.id)
        .get();
      expect(docProgram.exists).toBe(true);
    });

    it('4) ユーザーBを登録', async () => {
      const payload: CreateUserDto = {
        ...TEST_USERS.B,
        management_programs: [],
      };

      await request(app.getHttpServer())
        .post('/api/v1/onpaku/users')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .send(payload)
        .expect(201);

      // ユーザーの確認
      const docUser = await firestoreProvider
        .getFirestore()
        .collection('users')
        .doc(TEST_USERS.B.email)
        .get();
      expect(docUser.exists).toBe(true);

      // VCの確認
      const resVC = await request(app.getHttpServer())
        .get('/api/v1/onpaku/vcs/pending')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .query({ email: TEST_USERS.B.email })
        .expect(200);

      const vcs = resVC.body as VCDataDto[];
      expect(vcs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: VCType.User,
            status: VCStatus.Pending,
          }),
        ]),
      );
    });

    it('5) ユーザーBをアップデート（プログラムBのパートナーに追加）', async () => {
      const payload: UpdateUserDto = {
        id: TEST_USERS.B.id,
        email: TEST_USERS.B.email,
        management_programs: [
          {
            programId: TEST_PROGRAMS.B.id,
            role: 'partner',
          },
        ],
      };

      await request(app.getHttpServer())
        .patch('/api/v1/onpaku/users')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .send(payload)
        .expect(200);

      // パートナーVCの確認
      const resVC = await request(app.getHttpServer())
        .get('/api/v1/onpaku/vcs/pending')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .query({ email: TEST_USERS.B.email })
        .expect(200);

      const vcs = resVC.body as VCDataDto[];
      expect(vcs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: VCType.User,
            status: VCStatus.Pending,
          }),
          expect.objectContaining({
            type: VCType.Partner,
            status: VCStatus.Pending,
          }),
        ]),
      );
    });

    it('6) ユーザーCを登録', async () => {
      const payload: CreateUserDto = {
        ...TEST_USERS.C,
        management_programs: [],
      };

      await request(app.getHttpServer())
        .post('/api/v1/onpaku/users')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .send(payload)
        .expect(201);

      // ユーザーの確認
      const docUser = await firestoreProvider
        .getFirestore()
        .collection('users')
        .doc(TEST_USERS.C.email)
        .get();
      expect(docUser.exists).toBe(true);

      // VCの確認
      const resVC = await request(app.getHttpServer())
        .get('/api/v1/onpaku/vcs/pending')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .query({ email: TEST_USERS.C.email })
        .expect(200);

      const vcs = resVC.body as VCDataDto[];
      expect(vcs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: VCType.User,
            status: VCStatus.Pending,
          }),
        ]),
      );
    });

    it('7) ユーザーCがプログラムAを予約', async () => {
      const reservationId = 'reservation-a-123';
      const payload: CreateReservationDto = {
        reservation_id: reservationId,
        email: TEST_USERS.C.email,
        execution: {
          id: 'exec-a-1',
          program_id: TEST_PROGRAMS.A.id,
          start_time: '2025-05-01T10:00:00+09:00',
          end_time: '2025-05-01T12:00:00+09:00',
          capacity: 30,
          price: 5000,
        },
      };

      await request(app.getHttpServer())
        .post('/api/v1/onpaku/reservations')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .send(payload)
        .expect(201);

      // 予約の確認
      const docResv = await firestoreProvider
        .getFirestore()
        .collection('reservations')
        .doc(reservationId)
        .get();
      expect(docResv.exists).toBe(true);

      // イベントVCの確認
      const resVC = await request(app.getHttpServer())
        .get('/api/v1/onpaku/vcs/pending')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .query({ email: TEST_USERS.C.email })
        .expect(200);

      const vcs = resVC.body as VCDataDto[];
      expect(vcs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: VCType.User,
            status: VCStatus.Pending,
          }),
          expect.objectContaining({
            type: VCType.Event,
            status: VCStatus.Pending,
          }),
        ]),
      );
    });

    it('8) ユーザーCがプログラムBを予約', async () => {
      const reservationId = 'reservation-b-456';
      const payload: CreateReservationDto = {
        reservation_id: reservationId,
        email: TEST_USERS.C.email,
        execution: {
          id: 'exec-b-1',
          program_id: TEST_PROGRAMS.B.id,
          start_time: '2025-05-02T10:00:00+09:00',
          end_time: '2025-05-02T12:00:00+09:00',
          capacity: 30,
          price: 5000,
        },
      };

      await request(app.getHttpServer())
        .post('/api/v1/onpaku/reservations')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .send(payload)
        .expect(201);

      // 予約の確認
      const docResv = await firestoreProvider
        .getFirestore()
        .collection('reservations')
        .doc(reservationId)
        .get();
      expect(docResv.exists).toBe(true);

      // イベントVCの確認
      const resVC = await request(app.getHttpServer())
        .get('/api/v1/onpaku/vcs/pending')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .query({ email: TEST_USERS.C.email })
        .expect(200);

      const vcs = resVC.body as VCDataDto[];
      expect(vcs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: VCType.User,
            status: VCStatus.Pending,
          }),
          expect.objectContaining({
            type: VCType.Event,
            status: VCStatus.Pending,
          }),
          expect.objectContaining({
            type: VCType.Event,
            status: VCStatus.Pending,
          }),
        ]),
      );
    });

    it('9) 各ユーザーのVCステータスを確認', async () => {
      // ユーザーAのVC確認
      const resA = await request(app.getHttpServer())
        .get('/api/v1/onpaku/vcs/pending')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .query({ email: TEST_USERS.A.email })
        .expect(200);

      const vcsA = resA.body as VCDataDto[];
      expect(vcsA).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: VCType.User,
            status: VCStatus.Pending,
          }),
          expect.objectContaining({
            type: VCType.Partner,
            status: VCStatus.Pending,
          }),
        ]),
      );

      // ユーザーBのVC確認
      const resB = await request(app.getHttpServer())
        .get('/api/v1/onpaku/vcs/pending')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .query({ email: TEST_USERS.B.email })
        .expect(200);

      const vcsB = resB.body as VCDataDto[];
      expect(vcsB).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: VCType.User,
            status: VCStatus.Pending,
          }),
          expect.objectContaining({
            type: VCType.Partner,
            status: VCStatus.Pending,
          }),
        ]),
      );

      // ユーザーCのVC確認
      const resC = await request(app.getHttpServer())
        .get('/api/v1/onpaku/vcs/pending')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .query({ email: TEST_USERS.C.email })
        .expect(200);

      const vcsC = resC.body as VCDataDto[];
      expect(vcsC).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: VCType.User,
            status: VCStatus.Pending,
          }),
          expect.objectContaining({
            type: VCType.Event,
            status: VCStatus.Pending,
          }),
          expect.objectContaining({
            type: VCType.Event,
            status: VCStatus.Pending,
          }),
        ]),
      );
    });
  });
});
