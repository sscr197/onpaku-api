import { Test, TestingModule } from '@nestjs/testing';
import { VcsService } from './vcs.service';
import { FirestoreProvider } from '../shared/firestore/firestore.provider';
import { CustomLogger } from '../shared/logger/custom.logger';
import { VCType, VCStatus } from './dto/vc-data.dto';

describe('VcsService', () => {
  let service: VcsService;
  let firestoreMock: jest.Mocked<FirestoreProvider>;
  let loggerMock: jest.Mocked<CustomLogger>;
  let mockCollection: any;

  beforeEach(async () => {
    // Firestoreのモックを作成
    mockCollection = {
      doc: jest.fn().mockReturnThis(),
      set: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      where: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({
        docs: [
          {
            data: () => ({
              userEmail: 'test@example.com',
              type: VCType.User,
              vcData: { id: '1' },
              status: VCStatus.Pending,
              issuedAt: { toDate: () => new Date() },
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

    // Loggerのモックを作成
    loggerMock = {
      setContext: jest.fn(),
      debug: jest.fn(),
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      verbose: jest.fn(),
      fatal: jest.fn(),
      setLogLevels: jest.fn(),
      resetContext: jest.fn(),
      isLevelEnabled: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VcsService,
        {
          provide: FirestoreProvider,
          useValue: firestoreMock,
        },
        {
          provide: CustomLogger,
          useValue: loggerMock,
        },
      ],
    }).compile();

    service = module.get<VcsService>(VcsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrUpdateUserVC', () => {
    it('should create a user VC successfully', async () => {
      const email = 'test@example.com';
      const userData = { id: '1', name: 'Test User' };

      await service.createOrUpdateUserVC(email, userData);

      expect(firestoreMock.getFirestore().collection).toHaveBeenCalledWith(
        'vcs',
      );
      expect(loggerMock.debug).toHaveBeenCalledWith(
        `Creating/Updating User VC for email: ${email}`,
      );
      expect(loggerMock.log).toHaveBeenCalledWith(
        expect.stringContaining('User VC created/updated successfully'),
      );
    });

    it('should handle errors when creating user VC', async () => {
      const email = 'test@example.com';
      const userData = { id: '1', name: 'Test User' };
      const error = new Error('Firestore error');

      mockCollection.set.mockRejectedValueOnce(error);

      await expect(
        service.createOrUpdateUserVC(email, userData),
      ).rejects.toThrow(error);

      expect(loggerMock.error).toHaveBeenCalledWith(
        'Failed to create/update User VC: Firestore error',
        error.stack,
      );
    });
  });

  describe('getPendingVCsByEmail', () => {
    it('should return pending VCs for email', async () => {
      const email = 'test@example.com';

      const result = await service.getPendingVCsByEmail(email);

      expect(result).toHaveLength(1);
      expect(result[0].userEmail).toBe(email);
      expect(result[0].status).toBe(VCStatus.Pending);
      expect(firestoreMock.getFirestore().collection).toHaveBeenCalledWith(
        'vcs',
      );
      expect(mockCollection.where).toHaveBeenCalledWith(
        'userEmail',
        '==',
        email,
      );
      expect(mockCollection.where).toHaveBeenCalledWith(
        'status',
        '==',
        VCStatus.Pending,
      );
    });

    it('should handle errors when fetching pending VCs', async () => {
      const email = 'test@example.com';
      const error = new Error('Firestore error');

      jest
        .spyOn(firestoreMock.getFirestore(), 'collection')
        .mockImplementation(() => {
          throw error;
        });

      await expect(service.getPendingVCsByEmail(email)).rejects.toThrow(error);

      expect(loggerMock.error).toHaveBeenCalledWith(
        'Failed to fetch pending VCs: Firestore error',
        error.stack,
      );
    });
  });
});
