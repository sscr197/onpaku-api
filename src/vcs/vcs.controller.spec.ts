import { Test, TestingModule } from '@nestjs/testing';
import { VcsController } from './vcs.controller';
import { VcsService } from './vcs.service';
import { CustomLogger } from '../shared/logger/custom.logger';
import { VCDataDto, VCStatus, VCType } from './dto/vc-data.dto';
import { ConfigService } from '@nestjs/config';

describe('VcsController', () => {
  let controller: VcsController;
  let serviceMock: jest.Mocked<VcsService>;
  let loggerMock: jest.Mocked<CustomLogger>;

  beforeEach(async () => {
    loggerMock = {
      debug: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      verbose: jest.fn(),
      log: jest.fn(),
      fatal: jest.fn(),
      setLogLevels: jest.fn(),
      resetContext: jest.fn(),
      isLevelEnabled: jest.fn(),
      setContext: jest.fn(),
    } as unknown as jest.Mocked<CustomLogger>;

    serviceMock = {
      getPendingVCsByEmail: jest.fn(),
      activateVC: jest.fn(),
      revokeVC: jest.fn(),
      createOrUpdateUserVC: jest.fn(),
      createPartnerVC: jest.fn(),
      createEventVC: jest.fn(),
      firestore: {} as any,
      logger: {} as any,
      generateVcId: jest.fn(),
    } as unknown as jest.Mocked<VcsService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VcsController],
      providers: [
        {
          provide: VcsService,
          useValue: serviceMock,
        },
        {
          provide: CustomLogger,
          useValue: loggerMock,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-api-key'),
          },
        },
      ],
    }).compile();

    controller = module.get<VcsController>(VcsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getPendingVCs', () => {
    it('should return pending VCs for email', async () => {
      const email = 'test@example.com';
      const mockVCs: VCDataDto[] = [
        {
          userEmail: email,
          type: VCType.User,
          vcData: { id: 'vc1' },
          status: VCStatus.Pending,
          issuedAt: new Date(),
        },
      ];

      serviceMock.getPendingVCsByEmail.mockResolvedValue(mockVCs);

      const result = await controller.getPendingVCs(email);

      expect(result).toEqual(mockVCs);
      expect(serviceMock.getPendingVCsByEmail).toHaveBeenCalledWith(email);
      expect(loggerMock.debug).toHaveBeenCalledWith(
        `Received request to get pending VCs for email: ${email}`,
      );
    });

    it('should handle errors when getting pending VCs', async () => {
      const email = 'test@example.com';
      const error = new Error('Service error');

      serviceMock.getPendingVCsByEmail.mockRejectedValue(error);

      await expect(controller.getPendingVCs(email)).rejects.toThrow(error);

      expect(loggerMock.error).toHaveBeenCalledWith(
        `Failed to get pending VCs: ${error.message}`,
        error.stack,
      );
    });
  });

  describe('activateVC', () => {
    it('should activate VC successfully', async () => {
      const vcId = 'vc1';

      serviceMock.activateVC.mockResolvedValue(undefined);

      await controller.activateVC(vcId);

      expect(serviceMock.activateVC).toHaveBeenCalledWith(vcId);
      expect(loggerMock.debug).toHaveBeenCalledWith(
        `Received request to activate VC: ${vcId}`,
      );
    });

    it('should handle errors when activating VC', async () => {
      const vcId = 'vc1';
      const error = new Error('Service error');

      serviceMock.activateVC.mockRejectedValue(error);

      await expect(controller.activateVC(vcId)).rejects.toThrow(error);

      expect(loggerMock.error).toHaveBeenCalledWith(
        `Failed to activate VC: ${error.message}`,
        error.stack,
      );
    });
  });

  describe('revokeVC', () => {
    it('should revoke VC successfully', async () => {
      const vcId = 'vc1';

      serviceMock.revokeVC.mockResolvedValue(undefined);

      await controller.revokeVC(vcId);

      expect(serviceMock.revokeVC).toHaveBeenCalledWith(vcId);
      expect(loggerMock.debug).toHaveBeenCalledWith(
        `Received request to revoke VC: ${vcId}`,
      );
    });

    it('should handle errors when revoking VC', async () => {
      const vcId = 'vc1';
      const error = new Error('Service error');

      serviceMock.revokeVC.mockRejectedValue(error);

      await expect(controller.revokeVC(vcId)).rejects.toThrow(error);

      expect(loggerMock.error).toHaveBeenCalledWith(
        `Failed to revoke VC: ${error.message}`,
        error.stack,
      );
    });
  });
});
