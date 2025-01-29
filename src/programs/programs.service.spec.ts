import { Test, TestingModule } from '@nestjs/testing';
import { ProgramsService } from './programs.service';
import { FirestoreProvider } from '../shared/firestore/firestore.provider';
import { VcsService } from '../vcs/vcs.service';
import { CustomLogger } from '../shared/logger/custom.logger';
import { CreateProgramDto } from './dto/create-program.dto';
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
          title: 'Test Program',
          placeName: 'Test Place',
          prefecture: '東京都',
          address: '渋谷区',
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
      createOrUpdateUserVC: jest.fn().mockResolvedValue(undefined),
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
          {
            email: 'partner2@example.com',
            role: 'staff',
          },
        ],
      };

      await service.createOrUpdateProgram(createProgramDto);

      // Firestoreの呼び出しを検証
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

      // パートナーVCの作成を検証
      createProgramDto.partner_users.forEach((partner) => {
        expect(vcsServiceMock.createPartnerVC).toHaveBeenCalledWith(
          partner.email,
          expect.objectContaining({
            id: createProgramDto.program.id,
            title: createProgramDto.program.title,
            role: partner.role,
            placeName: createProgramDto.program.place_name,
            prefecture: createProgramDto.program.prefecture,
            address: createProgramDto.program.address,
          }),
        );
      });

      // ログ出力を検証
      expect(loggerMock.debug).toHaveBeenCalledWith(
        `Creating/Updating program: ${createProgramDto.program.id}`,
      );
      expect(loggerMock.log).toHaveBeenCalledWith(
        `Program created/updated successfully: ${createProgramDto.program.id}`,
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

  describe('addPartnerUser', () => {
    it('should add a partner user to an existing program', async () => {
      const programId = 'test-program';
      const userEmail = 'partner@example.com';
      const role = 'partner';

      // プログラムが存在する場合のモック
      mockDocRef.get.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          title: 'Test Program',
          placeName: 'Test Place',
          prefecture: '東京都',
          address: '渋谷区',
          partnerUsers: [],
        }),
      });

      await service.addPartnerUser(programId, userEmail, role);

      // プログラムの更新を確認
      expect(mockDocRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          partnerUsers: [{ email: userEmail, role }],
          updatedAt: expect.any(Date),
        }),
      );

      // パートナーVCの発行を確認
      expect(vcsServiceMock.createPartnerVC).toHaveBeenCalledWith(
        userEmail,
        expect.objectContaining({
          id: programId,
          title: 'Test Program',
          role,
          placeName: 'Test Place',
          prefecture: '東京都',
          address: '渋谷区',
        }),
      );
    });

    it('should throw NotFoundException when program does not exist', async () => {
      const programId = 'non-existent-program';
      const userEmail = 'partner@example.com';
      const role = 'partner';

      // プログラムが存在しない場合のモック
      mockDocRef.get.mockResolvedValueOnce({
        exists: false,
      });

      await expect(
        service.addPartnerUser(programId, userEmail, role),
      ).rejects.toThrow(NotFoundException);

      expect(mockDocRef.update).not.toHaveBeenCalled();
      expect(vcsServiceMock.createPartnerVC).not.toHaveBeenCalled();
    });

    it('should add a partner user to a program with existing partners', async () => {
      const programId = 'test-program';
      const existingPartner = {
        email: 'existing@example.com',
        role: 'partner',
      };
      const newPartner = { email: 'new@example.com', role: 'partner' };

      // 既存のパートナーがいる場合のモック
      mockDocRef.get.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          title: 'Test Program',
          placeName: 'Test Place',
          prefecture: '東京都',
          address: '渋谷区',
          partnerUsers: [existingPartner],
        }),
      });

      await service.addPartnerUser(
        programId,
        newPartner.email,
        newPartner.role,
      );

      // 既存のパートナーと新しいパートナーの両方が含まれていることを確認
      expect(mockDocRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          partnerUsers: [existingPartner, newPartner],
          updatedAt: expect.any(Date),
        }),
      );

      expect(vcsServiceMock.createPartnerVC).toHaveBeenCalledWith(
        newPartner.email,
        expect.objectContaining({
          id: programId,
          title: 'Test Program',
          role: newPartner.role,
          placeName: 'Test Place',
          prefecture: '東京都',
          address: '渋谷区',
        }),
      );
    });
  });
});
