import { Test, TestingModule } from '@nestjs/testing';
import { VcsController } from './vcs.controller';
import { VcsService } from './vcs.service';
import { CustomLogger } from '../shared/logger/custom.logger';
import { VCDataDto, VCStatus, VCType } from './dto/vc-data.dto';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';

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
      getPendingVCsByEmailTransformed: jest.fn(),
      updateVcStatus: jest.fn(),
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
      const mockVCs = [
        {
          documentId: 'vc1',
          email,
          type: 'user',
          status: VCStatus.Pending,
          vcData: {
            type: 'OnpakuUser',
            onpakuUserId: 'user1',
            familyName: '山田',
            firstName: '太郎',
          },
        },
      ];

      serviceMock.getPendingVCsByEmailTransformed.mockResolvedValue(mockVCs);

      const result = await controller.getPendingVCs(email);

      expect(result).toEqual(mockVCs);
      expect(serviceMock.getPendingVCsByEmailTransformed).toHaveBeenCalledWith(
        email,
      );
      expect(loggerMock.debug).toHaveBeenCalledWith(
        `Received request to get pending VCs for email: ${email}`,
      );
    });

    it('should throw BadRequestException when email is not provided', async () => {
      await expect(controller.getPendingVCs('')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle errors when getting pending VCs', async () => {
      const email = 'test@example.com';
      const error = new Error('Service error');

      serviceMock.getPendingVCsByEmailTransformed.mockRejectedValue(error);

      await expect(controller.getPendingVCs(email)).rejects.toThrow(error);

      expect(loggerMock.error).toHaveBeenCalledWith(
        `Failed to get pending VCs: ${error.message}`,
        error.stack,
      );
    });
  });

  describe('updateVcStatus', () => {
    it('should update VC status successfully', async () => {
      const documentId = 'vc1';
      const status = VCStatus.Completed;

      serviceMock.updateVcStatus.mockResolvedValue(undefined);

      await controller.updateVcStatus({ documentId, status });

      expect(serviceMock.updateVcStatus).toHaveBeenCalledWith(
        documentId,
        status,
      );
      expect(loggerMock.debug).toHaveBeenCalledWith(
        `Received request to update VC status: ${documentId} -> ${status}`,
      );
    });

    it('should throw BadRequestException when documentId is not provided', async () => {
      await expect(
        controller.updateVcStatus({
          documentId: '',
          status: VCStatus.Completed,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle errors when updating VC status', async () => {
      const documentId = 'vc1';
      const status = VCStatus.Completed;
      const error = new Error('Service error');

      serviceMock.updateVcStatus.mockRejectedValue(error);

      await expect(
        controller.updateVcStatus({ documentId, status }),
      ).rejects.toThrow(error);

      expect(loggerMock.error).toHaveBeenCalledWith(
        `Failed to update VC status: ${error.message}`,
        error.stack,
      );
    });
  });
});
