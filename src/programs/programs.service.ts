import { Injectable } from '@nestjs/common';
import { FirestoreProvider } from '../shared/firestore/firestore.provider';
import { VcsService } from '../vcs/vcs.service';
import { CreateProgramDto } from './dto/create-program.dto';

@Injectable()
export class ProgramsService {
  constructor(
    private readonly firestore: FirestoreProvider,
    private readonly vcsService: VcsService,
  ) {}

  async createOrUpdateProgram(dto: CreateProgramDto): Promise<void> {
    const programRef = this.firestore
      .getFirestore()
      .collection('programs')
      .doc(dto.program.id);

    await programRef.set(
      {
        title: dto.program.title,
        subTitle: dto.program.sub_title,
        number: dto.program.number,
        latitude: dto.program.latitude,
        longitude: dto.program.longitude,
        placeName: dto.program.place_name,
        zip: dto.program.zip,
        prefecture: dto.program.prefecture,
        address: dto.program.address,
        street: dto.program.street,
        partnerUsers: dto.partner_users,
        updatedAt: new Date(),
      },
      { merge: true },
    );

    // パートナーユーザーごとにVCを作成
    for (const partner of dto.partner_users) {
      await this.vcsService.createPartnerVC(partner.email, {
        id: dto.program.id,
        title: dto.program.title,
        role: partner.role,
        placeName: dto.program.place_name,
        prefecture: dto.program.prefecture,
        address: dto.program.address,
      });
    }
  }
}
