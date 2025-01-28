import { Test, TestingModule } from '@nestjs/testing';
import { ProgramsService } from './programs.service';
import { FirestoreProvider } from '../shared/firestore/firestore.provider';
import { VcsService } from '../vcs/vcs.service';
import { CustomLogger } from '../shared/logger/custom.logger';
import { CreateProgramDto } from './dto/create-program.dto';

describe('ProgramsService', () => {
  let service: ProgramsService;
  let firestoreMock: jest.Mocked<FirestoreProvider>;
  let vcsServiceMock: jest.Mocked<VcsService>;
  let loggerMock: jest.Mocked<CustomLogger>;
  let mockCollection: any;

  beforeEach(async () => {
    // Firestoreのモックを作成
    mockCollection = {
      doc: jest.fn().mockReturnThis(),
      set: jest.fn().mockResolvedValue(undefined),
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
      expect(mockCollection.set).toHaveBeenCalledWith(
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
      createProgramDto.partner_users.forEach((partner) => {
        expect(loggerMock.debug).toHaveBeenCalledWith(
          `Creating Partner VC for user: ${partner.email} in program: ${createProgramDto.program.id}`,
        );
      });
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

      mockCollection.set.mockRejectedValueOnce(error);

      await expect(
        service.createOrUpdateProgram(createProgramDto),
      ).rejects.toThrow(error);

      expect(loggerMock.error).toHaveBeenCalledWith(
        'Failed to create/update program: Firestore error',
        error.stack,
      );
    });
  });
});
