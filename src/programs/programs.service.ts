import { Injectable, NotFoundException } from '@nestjs/common';
import { FirestoreProvider } from '../shared/firestore/firestore.provider';
import { VcsService } from '../vcs/vcs.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { ProgramResponseDto } from './dto/program-response.dto';
import { CustomLogger } from '../shared/logger/custom.logger';

@Injectable()
export class ProgramsService {
  constructor(
    private readonly firestore: FirestoreProvider,
    private readonly vcsService: VcsService,
    private readonly logger: CustomLogger,
  ) {
    this.logger.setContext(ProgramsService.name);
  }

  async createOrUpdateProgram(dto: CreateProgramDto): Promise<void> {
    this.logger.debug(`Creating/Updating program: ${dto.program.id}`);

    try {
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
          partnerUsers: dto.partner_users.map((partner) => ({
            email: partner.email,
            role: partner.role,
          })),
          updatedAt: new Date(),
        },
        { merge: true },
      );

      this.logger.log(
        `Program created/updated successfully: ${dto.program.id}`,
      );

      // パートナーユーザーごとにVCを作成
      for (const partner of dto.partner_users) {
        this.logger.debug(
          `Creating Partner VC for user: ${partner.email} in program: ${dto.program.id}`,
        );
        await this.vcsService.createPartnerVC(partner.email, {
          id: dto.program.id,
          title: dto.program.title,
          role: partner.role,
          placeName: dto.program.place_name,
          prefecture: dto.program.prefecture,
          address: dto.program.address,
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed to create/update program: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async addPartnerUser(
    programId: string,
    email: string,
    role: string,
  ): Promise<void> {
    this.logger.debug(
      `Adding partner user ${email} with role ${role} to program ${programId}`,
    );

    try {
      const programRef = this.firestore
        .getFirestore()
        .collection('programs')
        .doc(programId);

      const programDoc = await programRef.get();
      if (!programDoc.exists) {
        throw new NotFoundException(`Program ${programId} not found`);
      }

      const programData = programDoc.data();
      if (!programData) {
        throw new Error(`Program data is empty for ${programId}`);
      }

      const partnerUsers = programData.partnerUsers || [];

      // 既存のパートナーユーザーリストを更新
      const existingPartnerIndex = partnerUsers.findIndex(
        (p) => p.email === email,
      );
      if (existingPartnerIndex >= 0) {
        partnerUsers[existingPartnerIndex].role = role;
      } else {
        partnerUsers.push({ email, role });
      }

      // プログラムを更新
      await programRef.update({
        partnerUsers,
        updatedAt: new Date(),
      });

      // パートナーVCを作成
      await this.vcsService.createPartnerVC(email, {
        id: programId,
        title: programData.title,
        role: role,
        placeName: programData.placeName,
        prefecture: programData.prefecture,
        address: programData.address,
      });

      this.logger.log(
        `Partner user ${email} added successfully to program ${programId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to add partner user: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async updateProgram(dto: UpdateProgramDto): Promise<void> {
    this.logger.debug(`Updating program with id: ${dto.program.id}`);
    try {
      const programRef = this.firestore
        .getFirestore()
        .collection('programs')
        .doc(dto.program.id);

      const programDoc = await programRef.get();
      if (!programDoc.exists) {
        throw new NotFoundException(`Program ${dto.program.id} not found`);
      }

      const updateData: any = {};
      if (dto.program.title) updateData.title = dto.program.title;
      if (dto.program.sub_title) updateData.subTitle = dto.program.sub_title;
      if (dto.program.number) updateData.number = dto.program.number;
      if (dto.program.latitude) updateData.latitude = dto.program.latitude;
      if (dto.program.longitude) updateData.longitude = dto.program.longitude;
      if (dto.program.place_name) updateData.placeName = dto.program.place_name;
      if (dto.program.zip) updateData.zip = dto.program.zip;
      if (dto.program.prefecture)
        updateData.prefecture = dto.program.prefecture;
      if (dto.program.address) updateData.address = dto.program.address;
      if (dto.program.street) updateData.street = dto.program.street;
      if (dto.partner_users) {
        updateData.partnerUsers = dto.partner_users.map((partner) => ({
          email: partner.email,
          role: partner.role,
        }));
      }
      updateData.updatedAt = new Date();

      await programRef.update(updateData);

      // パートナーユーザーが更新された場合、VCも更新
      if (dto.partner_users) {
        const programData = programDoc.data();
        for (const partner of dto.partner_users) {
          if (!partner.email || !partner.role) continue;

          this.logger.debug(
            `Updating Partner VC for user: ${partner.email} in program: ${dto.program.id}`,
          );
          await this.vcsService.createPartnerVC(partner.email, {
            id: dto.program.id,
            title: dto.program.title || programData?.title || '',
            role: partner.role,
            placeName: dto.program.place_name || programData?.placeName || '',
            prefecture: dto.program.prefecture || programData?.prefecture || '',
            address: dto.program.address || programData?.address || '',
          });
        }
      }

      this.logger.log(`Program updated successfully: ${dto.program.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to update program: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async findProgramById(id: string): Promise<ProgramResponseDto> {
    this.logger.debug(`Finding program by id: ${id}`);
    try {
      const programRef = this.firestore
        .getFirestore()
        .collection('programs')
        .doc(id);
      const doc = await programRef.get();
      if (!doc.exists) {
        throw new NotFoundException(`Program ${id} not found`);
      }
      const data = doc.data();
      return {
        program: {
          id: doc.id,
          title: data?.title,
          sub_title: data?.subTitle,
          number: data?.number,
          latitude: data?.latitude,
          longitude: data?.longitude,
          place_name: data?.placeName,
          zip: data?.zip,
          prefecture: data?.prefecture,
          address: data?.address,
          street: data?.street,
        },
        partner_users: data?.partnerUsers || [],
      };
    } catch (error) {
      this.logger.error(
        `Failed to find program by id: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
