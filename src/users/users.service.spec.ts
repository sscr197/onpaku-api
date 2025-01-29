import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { FirestoreProvider } from '../shared/firestore/firestore.provider';
import { VcsService } from '../vcs/vcs.service';
import { CustomLogger } from '../shared/logger/custom.logger';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ProgramRef } from './dto/program-ref';
import { NotFoundException } from '@nestjs/common';
import { ProgramsService } from '../programs/programs.service';

describe('UsersService', () => {
  let service: UsersService;
  let firestoreMock: jest.Mocked<FirestoreProvider>;
  let vcsServiceMock: jest.Mocked<VcsService>;
  let programsServiceMock: jest.Mocked<ProgramsService>;
  let loggerMock: jest.Mocked<CustomLogger>;
  let mockCollection: any;
  let mockDocRef: any;

  beforeEach(async () => {
    // Firestoreのモックを作成
    mockDocRef = {
      get: jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({
          managementPrograms: [],
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
    } as any;

    // ProgramsServiceのモックを作成
    programsServiceMock = {
      addPartnerUser: jest.fn().mockResolvedValue(undefined),
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
        UsersService,
        {
          provide: FirestoreProvider,
          useValue: firestoreMock,
        },
        {
          provide: VcsService,
          useValue: vcsServiceMock,
        },
        {
          provide: ProgramsService,
          useValue: programsServiceMock,
        },
        {
          provide: CustomLogger,
          useValue: loggerMock,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        id: 'user1',
        family_name: '山田',
        first_name: '太郎',
        birth_year: 1990,
        gender: 'male',
        zip: '123-4567',
        prefecture: '東京都',
        address: '渋谷区',
        street: '1-1-1',
        tel: '03-1234-5678',
        management_programs: [],
      };

      await service.createUser(createUserDto);

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
          managementPrograms: [],
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

      expect(loggerMock.debug).toHaveBeenCalledWith(
        `Creating user with email: ${createUserDto.email}`,
      );
      expect(loggerMock.log).toHaveBeenCalledWith(
        `User created successfully: ${createUserDto.email}`,
      );
    });

    it('should handle errors when creating user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        id: 'user1',
        family_name: '山田',
        first_name: '太郎',
        birth_year: 1990,
        gender: 'male',
        zip: '123-4567',
        prefecture: '東京都',
        address: '渋谷区',
        street: '1-1-1',
        tel: '03-1234-5678',
        management_programs: [],
      };
      const error = new Error('Firestore error');

      mockDocRef.set.mockRejectedValueOnce(error);

      await expect(service.createUser(createUserDto)).rejects.toThrow(error);

      expect(loggerMock.error).toHaveBeenCalledWith(
        'Failed to create user: Firestore error',
        error.stack,
      );
    });
  });

  describe('updateUser', () => {
    it('should update a user successfully', async () => {
      const mockProgramRef: ProgramRef = {
        id: 'program1',
        programId: 'program1',
        role: 'owner',
      };

      const updateUserDto: UpdateUserDto = {
        email: 'test@example.com',
        id: 'user1',
        family_name: '山田',
        first_name: '花子',
        management_programs: [mockProgramRef],
      };

      // ユーザーが存在することをモック
      mockDocRef.get.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          managementPrograms: [],
        }),
      });

      await service.updateUser(updateUserDto);

      expect(firestoreMock.getFirestore().collection).toHaveBeenCalledWith(
        'users',
      );
      expect(mockCollection.doc).toHaveBeenCalledWith(updateUserDto.email);
      expect(mockDocRef.get).toHaveBeenCalled();
      expect(mockDocRef.update).toHaveBeenCalledWith({
        familyName: updateUserDto.family_name,
        firstName: updateUserDto.first_name,
        managementPrograms: updateUserDto.management_programs,
      });

      expect(vcsServiceMock.createOrUpdateUserVC).toHaveBeenCalledWith(
        updateUserDto.email,
        expect.objectContaining({
          id: updateUserDto.id,
          familyName: updateUserDto.family_name,
          firstName: updateUserDto.first_name,
        }),
      );

      expect(loggerMock.debug).toHaveBeenCalledWith(
        `Updating user with email: ${updateUserDto.email}`,
      );
      expect(loggerMock.log).toHaveBeenCalledWith(
        `User updated successfully: ${updateUserDto.email}`,
      );
    });

    it('should throw NotFoundException when user does not exist', async () => {
      const updateUserDto: UpdateUserDto = {
        email: 'nonexistent@example.com',
        id: 'user1',
        family_name: '山田',
        first_name: '花子',
      };

      // ユーザーが存在しないことをモック
      mockDocRef.get.mockResolvedValueOnce({ exists: false });

      await expect(service.updateUser(updateUserDto)).rejects.toThrow(
        NotFoundException,
      );

      expect(loggerMock.error).toHaveBeenCalledWith(
        `User not found: ${updateUserDto.email}`,
      );
      expect(mockDocRef.update).not.toHaveBeenCalled();
      expect(vcsServiceMock.createOrUpdateUserVC).not.toHaveBeenCalled();
    });

    it('should handle errors when updating user', async () => {
      const updateUserDto: UpdateUserDto = {
        email: 'test@example.com',
        id: 'user1',
        family_name: '山田',
        first_name: '花子',
      };
      const error = new Error('Firestore error');

      // ユーザーが存在することをモック
      mockDocRef.get.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          managementPrograms: [],
        }),
      });
      mockDocRef.update.mockRejectedValueOnce(error);

      await expect(service.updateUser(updateUserDto)).rejects.toThrow(error);

      expect(loggerMock.error).toHaveBeenCalledWith(
        'Failed to update user: Firestore error',
        error.stack,
      );
    });

    it('should update a user and add new program partner successfully', async () => {
      const existingPrograms = [
        { programId: 'existing-program', role: 'staff' },
      ];

      // 既存のユーザーデータをモック
      mockDocRef.get.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          managementPrograms: existingPrograms,
        }),
      });

      const updateUserDto: UpdateUserDto = {
        email: 'test@example.com',
        id: 'user1',
        family_name: '山田',
        first_name: '花子',
        management_programs: [
          { programId: 'existing-program', role: 'staff' },
          { programId: 'new-program', role: 'partner' },
        ],
      };

      await service.updateUser(updateUserDto);

      // 新しいプログラムのみがパートナーとして追加されることを確認
      expect(programsServiceMock.addPartnerUser).toHaveBeenCalledTimes(1);
      expect(programsServiceMock.addPartnerUser).toHaveBeenCalledWith(
        'new-program',
        updateUserDto.email,
        'partner',
      );

      // ユーザー情報の更新を確認
      expect(mockDocRef.update).toHaveBeenCalledWith({
        familyName: updateUserDto.family_name,
        firstName: updateUserDto.first_name,
        managementPrograms: updateUserDto.management_programs,
      });

      // VCの更新を確認
      expect(vcsServiceMock.createOrUpdateUserVC).toHaveBeenCalledWith(
        updateUserDto.email,
        expect.objectContaining({
          id: updateUserDto.id,
          familyName: updateUserDto.family_name,
          firstName: updateUserDto.first_name,
        }),
      );
    });

    it('should handle errors when adding program partner', async () => {
      mockDocRef.get.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          managementPrograms: [],
        }),
      });

      const updateUserDto: UpdateUserDto = {
        email: 'test@example.com',
        id: 'user1',
        management_programs: [{ programId: 'new-program', role: 'partner' }],
      };

      const error = new Error('Failed to add partner');
      programsServiceMock.addPartnerUser.mockRejectedValueOnce(error);

      await expect(service.updateUser(updateUserDto)).rejects.toThrow(error);

      expect(programsServiceMock.addPartnerUser).toHaveBeenCalledWith(
        'new-program',
        updateUserDto.email,
        'partner',
      );
      expect(mockDocRef.update).not.toHaveBeenCalled();
      expect(vcsServiceMock.createOrUpdateUserVC).not.toHaveBeenCalled();
    });
  });
});
