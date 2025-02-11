import { Test, TestingModule } from '@nestjs/testing';
import { ProgramsService } from './programs.service';
import { FirestoreProvider } from '../shared/firestore/firestore.provider';
import { VcsService } from '../vcs/vcs.service';
import { CustomLogger } from '../shared/logger/custom.logger';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { NotFoundException } from '@nestjs/common';

describe('ProgramsService', () => {
  let service: ProgramsService;
  let firestoreMock: jest.Mocked<FirestoreProvider>;
  let vcsServiceMock: jest.Mocked<VcsService>;
  let loggerMock: jest.Mocked<CustomLogger>;
  let mockCollection: any;
  let mockDocRef: any;

  beforeEach(async () => {
    // Firestoreのモックを作成
    mockDocRef = {
      get: jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({
          title: '既存のタイトル',
          subTitle: '既存のサブタイトル',
          number: 1,
          latitude: 35.6895,
          longitude: 139.6917,
          placeName: '既存の会場',
          zip: '123-4567',
          prefecture: '既存の都道府県',
          address: '既存の市区町村',
          street: '既存の番地',
          partnerUsers: [],
        }),
      }),
      set: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
    };

    mockCollection = {
      doc: jest.fn().mockReturnValue(mockDocRef),
    };

    const mockFirestore = {
      collection: jest.fn().mockReturnValue(mockCollection),
    };

    firestoreMock = {
      getFirestore: jest.fn().mockReturnValue(mockFirestore),
    } as any;

    // VcsServiceのモックを作成
    vcsServiceMock = {
      createPartnerVC: jest.fn().mockResolvedValue(undefined),
    } as any;

    // Loggerのモックを作成
    loggerMock = {
      setContext: jest.fn(),
      debug: jest.fn(),
      log: jest.fn(),
      error: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgramsService,
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

    service = module.get<ProgramsService>(ProgramsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrUpdateProgram', () => {
    it('should create a program and partner VCs successfully', async () => {
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
            email: 'partner1@example.com',
            role: 'owner',
          },
        ],
      };

      await service.createOrUpdateProgram(createProgramDto);

      expect(firestoreMock.getFirestore().collection).toHaveBeenCalledWith(
        'programs',
      );
      expect(mockCollection.doc).toHaveBeenCalledWith(
        createProgramDto.program.id,
      );
      expect(mockDocRef.set).toHaveBeenCalledWith(
        expect.objectContaining({
          title: createProgramDto.program.title,
          subTitle: createProgramDto.program.sub_title,
          number: createProgramDto.program.number,
          latitude: createProgramDto.program.latitude,
          longitude: createProgramDto.program.longitude,
          placeName: createProgramDto.program.place_name,
          zip: createProgramDto.program.zip,
          prefecture: createProgramDto.program.prefecture,
          address: createProgramDto.program.address,
          street: createProgramDto.program.street,
          partnerUsers: createProgramDto.partner_users,
          updatedAt: expect.any(Date),
        }),
        { merge: true },
      );

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

    it('should handle errors when creating program', async () => {
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
        partner_users: [],
      };

      const error = new Error('Firestore error');
      mockDocRef.set.mockRejectedValueOnce(error);

      await expect(
        service.createOrUpdateProgram(createProgramDto),
      ).rejects.toThrow(error);

      expect(loggerMock.error).toHaveBeenCalledWith(
        'Failed to create/update program: Firestore error',
        error.stack,
      );
    });
  });

  describe('updateProgram', () => {
    it('should update a program successfully', async () => {
      const updateProgramDto: UpdateProgramDto = {
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
        partner_users: [{ email: 'partner1@example.com', role: 'owner' }],
      };

      await service.updateProgram(updateProgramDto);

      expect(mockDocRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          title: updateProgramDto.title,
          subTitle: updateProgramDto.sub_title,
          number: updateProgramDto.number,
          latitude: updateProgramDto.latitude,
          longitude: updateProgramDto.longitude,
          placeName: updateProgramDto.place_name,
          zip: updateProgramDto.zip,
          prefecture: updateProgramDto.prefecture,
          address: updateProgramDto.address,
          street: updateProgramDto.street,
          partnerUsers: updateProgramDto.partner_users,
          updatedAt: expect.any(Date),
        }),
      );

      // パートナーユーザーが指定されている場合のみVCの更新を確認
      if (
        updateProgramDto.partner_users &&
        updateProgramDto.partner_users.length > 0
      ) {
        expect(vcsServiceMock.createPartnerVC).toHaveBeenCalledWith(
          updateProgramDto.partner_users[0].email,
          expect.objectContaining({
            id: updateProgramDto.id,
            title: updateProgramDto.title,
            role: updateProgramDto.partner_users[0].role,
            placeName: updateProgramDto.place_name,
            prefecture: updateProgramDto.prefecture,
            address: updateProgramDto.address,
          }),
        );
      }
    });

    it('should throw NotFoundException when program does not exist', async () => {
      const updateProgramDto: UpdateProgramDto = {
        id: 'non-existent',
        title: '更新後のタイトル',
      };

      mockDocRef.get.mockResolvedValueOnce({ exists: false });

      await expect(service.updateProgram(updateProgramDto)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockDocRef.update).not.toHaveBeenCalled();
      expect(vcsServiceMock.createPartnerVC).not.toHaveBeenCalled();
    });

    it('should handle errors when updating program', async () => {
      const updateProgramDto: UpdateProgramDto = {
        id: 'program1',
        title: '更新後のタイトル',
      };

      const error = new Error('Firestore error');
      mockDocRef.update.mockRejectedValueOnce(error);

      await expect(service.updateProgram(updateProgramDto)).rejects.toThrow(
        error,
      );

      expect(loggerMock.error).toHaveBeenCalledWith(
        `Failed to update program: ${error.message}`,
        error.stack,
      );
    });

    it('should update only specified fields', async () => {
      const updateProgramDto: UpdateProgramDto = {
        id: 'program1',
        title: '更新後のタイトル',
        // 他のフィールドは未指定
      };

      await service.updateProgram(updateProgramDto);

      expect(mockDocRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          title: updateProgramDto.title,
          updatedAt: expect.any(Date),
        }),
      );

      // 未指定のフィールドが更新データに含まれていないことを確認
      const updateCall = mockDocRef.update.mock.calls[0][0];
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
});
