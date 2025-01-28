import { Injectable } from '@nestjs/common';
import { FirestoreProvider } from '../shared/firestore/firestore.provider';
import { VcsService } from '../vcs/vcs.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly firestore: FirestoreProvider,
    private readonly vcsService: VcsService,
  ) {}

  async createUser(dto: CreateUserDto): Promise<void> {
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
  }

  async updateUser(dto: UpdateUserDto): Promise<void> {
    const userRef = this.firestore
      .getFirestore()
      .collection('users')
      .doc(dto.email);

    const updateData: any = {};
    if (dto.family_name) updateData.familyName = dto.family_name;
    if (dto.first_name) updateData.firstName = dto.first_name;
    if (dto.management_programs) {
      updateData.managementPrograms = dto.management_programs;
    }

    await userRef.update(updateData);

    // VCsコレクションのユーザー情報も更新
    const userData = {
      id: dto.id,
      ...(dto.family_name && { familyName: dto.family_name }),
      ...(dto.first_name && { firstName: dto.first_name }),
    };
    await this.vcsService.createOrUpdateUserVC(dto.email, userData);
  }
}
