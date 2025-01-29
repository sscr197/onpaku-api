import { Injectable, NotFoundException } from '@nestjs/common';
import { FirestoreProvider } from '../shared/firestore/firestore.provider';
import { VcsService } from '../vcs/vcs.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CustomLogger } from '../shared/logger/custom.logger';

@Injectable()
export class UsersService {
  constructor(
    private readonly firestore: FirestoreProvider,
    private readonly vcsService: VcsService,
    private readonly logger: CustomLogger,
  ) {
    this.logger.setContext(UsersService.name);
  }

  async createUser(dto: CreateUserDto): Promise<void> {
    this.logger.debug(`Creating user with email: ${dto.email}`);

    try {
      const userRef = this.firestore
        .getFirestore()
        .collection('users')
        .doc(dto.email);

      await userRef.set({
        onpakuUserId: dto.id,
        familyName: dto.family_name,
        firstName: dto.first_name,
        birthYear: dto.birth_year,
        gender: dto.gender,
        zip: dto.zip,
        prefecture: dto.prefecture,
        address: dto.address,
        street: dto.street,
        tel: dto.tel,
        managementPrograms: dto.management_programs || [],
        createdAt: new Date(),
      });

      this.logger.log(`User created successfully: ${dto.email}`);

      // VCsコレクションにユーザー情報を記録
      await this.vcsService.createOrUpdateUserVC(dto.email, {
        id: dto.id,
        familyName: dto.family_name,
        firstName: dto.first_name,
        birthYear: dto.birth_year,
        gender: dto.gender,
        zip: dto.zip,
        prefecture: dto.prefecture,
        address: dto.address,
        street: dto.street,
        tel: dto.tel,
      });
    } catch (error) {
      this.logger.error(`Failed to create user: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateUser(dto: UpdateUserDto): Promise<void> {
    this.logger.debug(`Updating user with email: ${dto.email}`);

    try {
      const userRef = this.firestore
        .getFirestore()
        .collection('users')
        .doc(dto.email);

      // ユーザーの存在確認を追加
      const userDoc = await userRef.get();
      if (!userDoc.exists) {
        this.logger.error(`User not found: ${dto.email}`);
        throw new NotFoundException(`User with email ${dto.email} not found`);
      }

      const updateData: any = {};
      if (dto.family_name) updateData.familyName = dto.family_name;
      if (dto.first_name) updateData.firstName = dto.first_name;
      if (dto.management_programs) {
        updateData.managementPrograms = dto.management_programs;
      }

      await userRef.update(updateData);
      this.logger.log(`User updated successfully: ${dto.email}`);

      // VCsコレクションのユーザー情報も更新
      const userData = {
        id: dto.id,
        ...(dto.family_name && { familyName: dto.family_name }),
        ...(dto.first_name && { firstName: dto.first_name }),
      };
      await this.vcsService.createOrUpdateUserVC(dto.email, userData);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to update user: ${error.message}`, error.stack);
      throw error;
    }
  }
}
