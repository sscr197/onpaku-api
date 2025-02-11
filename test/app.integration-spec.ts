// test/integration/e2e.integration-spec.ts
import * as request from 'supertest';
import { VCDataDto, VCType, VCStatus } from '../src/vcs/dto/vc-data.dto';

// テストのタイムアウトを30秒に延長
jest.setTimeout(30000);

const API_URL = 'http://localhost:3000';
const API_KEY = 'your-api-key';

describe('IntegrationE2E', () => {
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

  describe('ユーザー登録とプログラム管理フロー', () => {
    it('1) ユーザーAを登録', async () => {
      const payload = {
        ...TEST_USERS.A,
        management_programs: [],
      };

      await request(API_URL)
        .post('/api/v1/onpaku/users')
        .set('Authorization', `Bearer ${API_KEY}`)
        .send(payload)
        .expect(201);

      // ユーザーの確認
      const resUser = await request(API_URL)
        .get(`/api/v1/onpaku/users/${TEST_USERS.A.email}`)
        .set('Authorization', `Bearer ${API_KEY}`)
        .expect(200);

      expect(resUser.body).toMatchObject({
        id: TEST_USERS.A.id,
        email: TEST_USERS.A.email,
        family_name: TEST_USERS.A.family_name,
        first_name: TEST_USERS.A.first_name,
        birth_year: TEST_USERS.A.birth_year,
        gender: TEST_USERS.A.gender,
        zip: TEST_USERS.A.zip,
        prefecture: TEST_USERS.A.prefecture,
        address: TEST_USERS.A.address,
        street: TEST_USERS.A.street,
        tel: TEST_USERS.A.tel,
        management_programs: [],
      });

      // VCの確認
      const resVC = await request(API_URL)
        .get('/api/v1/onpaku/vcs/pending')
        .set('Authorization', `Bearer ${API_KEY}`)
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
      const createProgramDto = {
        program: TEST_PROGRAMS.A,
        partner_users: [
          {
            email: TEST_USERS.A.email,
            role: 'owner',
          },
        ],
      };

      await request(API_URL)
        .post('/api/v1/onpaku/programs')
        .set('Authorization', `Bearer ${API_KEY}`)
        .send(createProgramDto)
        .expect(201);

      // プログラムの確認
      const resProgram = await request(API_URL)
        .get(`/api/v1/onpaku/programs/${TEST_PROGRAMS.A.id}`)
        .set('Authorization', `Bearer ${API_KEY}`)
        .expect(200);

      expect(resProgram.body).toMatchObject({
        id: TEST_PROGRAMS.A.id,
        title: TEST_PROGRAMS.A.title,
        sub_title: TEST_PROGRAMS.A.sub_title,
        number: TEST_PROGRAMS.A.number,
        latitude: TEST_PROGRAMS.A.latitude,
        longitude: TEST_PROGRAMS.A.longitude,
        place_name: TEST_PROGRAMS.A.place_name,
        zip: TEST_PROGRAMS.A.zip,
        prefecture: TEST_PROGRAMS.A.prefecture,
        address: TEST_PROGRAMS.A.address,
        street: TEST_PROGRAMS.A.street,
      });

      // パートナーVCの確認
      const resVC = await request(API_URL)
        .get('/api/v1/onpaku/vcs/pending')
        .set('Authorization', `Bearer ${API_KEY}`)
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
      const createProgramDto = {
        program: TEST_PROGRAMS.B,
        partner_users: [],
      };

      await request(API_URL)
        .post('/api/v1/onpaku/programs')
        .set('Authorization', `Bearer ${API_KEY}`)
        .send(createProgramDto)
        .expect(201);

      const resProgram = await request(API_URL)
        .get(`/api/v1/onpaku/programs/${TEST_PROGRAMS.B.id}`)
        .set('Authorization', `Bearer ${API_KEY}`)
        .expect(200);

      expect(resProgram.body).toMatchObject({
        id: TEST_PROGRAMS.B.id,
        title: TEST_PROGRAMS.B.title,
        sub_title: TEST_PROGRAMS.B.sub_title,
        number: TEST_PROGRAMS.B.number,
        latitude: TEST_PROGRAMS.B.latitude,
        longitude: TEST_PROGRAMS.B.longitude,
        place_name: TEST_PROGRAMS.B.place_name,
        zip: TEST_PROGRAMS.B.zip,
        prefecture: TEST_PROGRAMS.B.prefecture,
        address: TEST_PROGRAMS.B.address,
        street: TEST_PROGRAMS.B.street,
      });
    });

    it('4) ユーザーBを登録', async () => {
      const payload = {
        ...TEST_USERS.B,
        management_programs: [],
      };

      await request(API_URL)
        .post('/api/v1/onpaku/users')
        .set('Authorization', `Bearer ${API_KEY}`)
        .send(payload)
        .expect(201);

      // ユーザーの確認
      const resUser = await request(API_URL)
        .get(`/api/v1/onpaku/users/${TEST_USERS.B.email}`)
        .set('Authorization', `Bearer ${API_KEY}`)
        .expect(200);

      expect(resUser.body).toMatchObject({
        id: TEST_USERS.B.id,
        email: TEST_USERS.B.email,
        family_name: TEST_USERS.B.family_name,
        first_name: TEST_USERS.B.first_name,
        birth_year: TEST_USERS.B.birth_year,
        gender: TEST_USERS.B.gender,
        zip: TEST_USERS.B.zip,
        prefecture: TEST_USERS.B.prefecture,
        address: TEST_USERS.B.address,
        street: TEST_USERS.B.street,
        tel: TEST_USERS.B.tel,
        management_programs: [],
      });

      // VCの確認
      const resVC = await request(API_URL)
        .get('/api/v1/onpaku/vcs/pending')
        .set('Authorization', `Bearer ${API_KEY}`)
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
      const payload = {
        id: TEST_USERS.B.id,
        email: TEST_USERS.B.email,
        management_programs: [
          {
            programId: TEST_PROGRAMS.B.id,
            role: 'partner',
          },
        ],
      };

      await request(API_URL)
        .patch('/api/v1/onpaku/users')
        .set('Authorization', `Bearer ${API_KEY}`)
        .send(payload)
        .expect(200);

      // パートナーVCの確認
      const resVC = await request(API_URL)
        .get('/api/v1/onpaku/vcs/pending')
        .set('Authorization', `Bearer ${API_KEY}`)
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
      const payload = {
        ...TEST_USERS.C,
        management_programs: [],
      };

      await request(API_URL)
        .post('/api/v1/onpaku/users')
        .set('Authorization', `Bearer ${API_KEY}`)
        .send(payload)
        .expect(201);

      // ユーザーの確認
      const resUser = await request(API_URL)
        .get(`/api/v1/onpaku/users/${TEST_USERS.C.email}`)
        .set('Authorization', `Bearer ${API_KEY}`)
        .expect(200);

      expect(resUser.body).toMatchObject({
        id: TEST_USERS.C.id,
        email: TEST_USERS.C.email,
        family_name: TEST_USERS.C.family_name,
        first_name: TEST_USERS.C.first_name,
        birth_year: TEST_USERS.C.birth_year,
        gender: TEST_USERS.C.gender,
        zip: TEST_USERS.C.zip,
        prefecture: TEST_USERS.C.prefecture,
        address: TEST_USERS.C.address,
        street: TEST_USERS.C.street,
        tel: TEST_USERS.C.tel,
        management_programs: [],
      });

      // VCの確認
      const resVC = await request(API_URL)
        .get('/api/v1/onpaku/vcs/pending')
        .set('Authorization', `Bearer ${API_KEY}`)
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
      const payload = {
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

      await request(API_URL)
        .post('/api/v1/onpaku/reservations')
        .set('Authorization', `Bearer ${API_KEY}`)
        .send(payload)
        .expect(201);

      // 予約の確認
      const resResv = await request(API_URL)
        .get(`/api/v1/onpaku/reservations/${reservationId}`)
        .set('Authorization', `Bearer ${API_KEY}`)
        .expect(200);

      expect(resResv.body).toMatchObject({
        reservation_id: reservationId,
        email: TEST_USERS.C.email,
        execution: {
          id: 'exec-a-1',
          program_id: TEST_PROGRAMS.A.id,
          start_time: expect.any(String),
          end_time: expect.any(String),
          capacity: 30,
          price: 5000,
        },
      });

      // イベントVCの確認
      const resVC = await request(API_URL)
        .get('/api/v1/onpaku/vcs/pending')
        .set('Authorization', `Bearer ${API_KEY}`)
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
      const payload = {
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

      await request(API_URL)
        .post('/api/v1/onpaku/reservations')
        .set('Authorization', `Bearer ${API_KEY}`)
        .send(payload)
        .expect(201);

      // 予約の確認
      const resResv = await request(API_URL)
        .get(`/api/v1/onpaku/reservations/${reservationId}`)
        .set('Authorization', `Bearer ${API_KEY}`)
        .expect(200);

      expect(resResv.body).toMatchObject({
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
      });

      // イベントVCの確認
      const resVC = await request(API_URL)
        .get('/api/v1/onpaku/vcs/pending')
        .set('Authorization', `Bearer ${API_KEY}`)
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
      const resA = await request(API_URL)
        .get('/api/v1/onpaku/vcs/pending')
        .set('Authorization', `Bearer ${API_KEY}`)
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
      const resB = await request(API_URL)
        .get('/api/v1/onpaku/vcs/pending')
        .set('Authorization', `Bearer ${API_KEY}`)
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
      const resC = await request(API_URL)
        .get('/api/v1/onpaku/vcs/pending')
        .set('Authorization', `Bearer ${API_KEY}`)
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

    it('10) パートナーなしでプログラムを登録し、VCが発行されていないことを確認', async () => {
      const programId = 'program-no-partner';
      const createProgramDto = {
        program: {
          id: programId,
          title: 'パートナーなしプログラム',
          sub_title: 'サブタイトル',
          number: 3,
          latitude: 35.6895,
          longitude: 139.6917,
          place_name: '会場C',
          zip: '123-4567',
          prefecture: '東京都',
          address: '港区',
          street: '3-3-3',
        },
        partner_users: [], // パートナーなし
      };

      // プログラムを登録
      await request(API_URL)
        .post('/api/v1/onpaku/programs')
        .set('Authorization', `Bearer ${API_KEY}`)
        .send(createProgramDto)
        .expect(201);

      // プログラムが作成されたことを確認
      const resProgram = await request(API_URL)
        .get(`/api/v1/onpaku/programs/${programId}`)
        .set('Authorization', `Bearer ${API_KEY}`)
        .expect(200);

      expect(resProgram.body).toMatchObject({
        id: programId,
        title: 'パートナーなしプログラム',
        partnerUsers: [],
      });

      // VCが発行されていないことを確認（既存のユーザーで確認）
      const resVC = await request(API_URL)
        .get('/api/v1/onpaku/vcs/pending')
        .set('Authorization', `Bearer ${API_KEY}`)
        .query({ email: TEST_USERS.A.email })
        .expect(200);

      const vcs = resVC.body as VCDataDto[];
      // 既存のVCのみが存在することを確認（新しいパートナーVCが発行されていないこと）
      expect(vcs).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: VCType.Partner,
            status: VCStatus.Pending,
            programId: programId,
          }),
        ]),
      );
    });

    it('11) PATCHでパートナーを追加し、VCが発行されることを確認', async () => {
      const programId = 'program-no-partner';
      const updateProgramDto = {
        id: programId,
        partner_users: [
          {
            email: TEST_USERS.A.email,
            role: 'owner',
          },
        ],
      };

      // プログラムを更新
      await request(API_URL)
        .patch('/api/v1/onpaku/programs')
        .set('Authorization', `Bearer ${API_KEY}`)
        .send(updateProgramDto)
        .expect(200);

      // プログラムが更新されたことを確認
      const resProgram = await request(API_URL)
        .get(`/api/v1/onpaku/programs/${programId}`)
        .set('Authorization', `Bearer ${API_KEY}`)
        .expect(200);

      expect(resProgram.body).toMatchObject({
        id: programId,
        partnerUsers: updateProgramDto.partner_users,
      });

      // パートナーVCが発行されたことを確認
      const resVC = await request(API_URL)
        .get('/api/v1/onpaku/vcs/pending')
        .set('Authorization', `Bearer ${API_KEY}`)
        .query({ email: TEST_USERS.A.email })
        .expect(200);

      const vcs = resVC.body as VCDataDto[];
      expect(vcs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: VCType.Partner,
            status: VCStatus.Pending,
            vcData: expect.objectContaining({
              id: programId,
            }),
          }),
        ]),
      );
    });
  });
});
