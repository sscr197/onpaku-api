import { Injectable } from '@nestjs/common';
import { FirestoreProvider } from '../shared/firestore/firestore.provider';
import { VCDataDto, VCType, VCStatus } from './dto/vc-data.dto';
import { CustomLogger } from '../shared/logger/custom.logger';

@Injectable()
export class VcsService {
  constructor(
    private readonly firestore: FirestoreProvider,
    private readonly logger: CustomLogger,
  ) {
    this.logger.setContext(VcsService.name);
  }

  private generateVcId(
    type: VCType,
    email: string,
    additionalId?: string,
  ): string {
    return additionalId
      ? `${type}_${email}_${additionalId}`
      : `${type}_${email}`;
  }

  async createOrUpdateUserVC(email: string, userData: any): Promise<void> {
    this.logger.debug(`Creating/Updating User VC for email: ${email}`);
    const vcId = this.generateVcId(VCType.User, email);
    const vcRef = this.firestore.getFirestore().collection('vcs').doc(vcId);

    try {
      await vcRef.set(
        {
          userEmail: email,
          type: VCType.User,
          vcData: userData,
          status: VCStatus.Pending,
          issuedAt: new Date(),
        },
        { merge: true },
      );
      this.logger.log(`User VC created/updated successfully: ${vcId}`);
    } catch (error) {
      this.logger.error(
        `Failed to create/update User VC: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async createPartnerVC(email: string, programData: any): Promise<void> {
    this.logger.debug(`Creating Partner VC for email: ${email}`);
    const vcId = this.generateVcId(VCType.Partner, email, programData.id);
    const vcRef = this.firestore.getFirestore().collection('vcs').doc(vcId);

    try {
      await vcRef.set({
        userEmail: email,
        type: VCType.Partner,
        vcData: programData,
        status: VCStatus.Pending,
        issuedAt: new Date(),
      });
      this.logger.log(`Partner VC created successfully: ${vcId}`);
    } catch (error) {
      this.logger.error(
        `Failed to create Partner VC: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async createEventVC(email: string, reservationData: any): Promise<void> {
    this.logger.debug(`Creating Event VC for email: ${email}`);
    const vcId = this.generateVcId(
      VCType.Event,
      email,
      reservationData.reservationId,
    );
    const vcRef = this.firestore.getFirestore().collection('vcs').doc(vcId);

    try {
      await vcRef.set({
        userEmail: email,
        type: VCType.Event,
        vcData: reservationData,
        status: VCStatus.Pending,
        issuedAt: new Date(),
      });
      this.logger.log(`Event VC created successfully: ${vcId}`);
    } catch (error) {
      this.logger.error(
        `Failed to create Event VC: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getPendingVCsByEmail(email: string): Promise<VCDataDto[]> {
    this.logger.debug(`Fetching pending VCs for email: ${email}`);
    try {
      const snapshot = await this.firestore
        .getFirestore()
        .collection('vcs')
        .where('userEmail', '==', email)
        .where('status', '==', VCStatus.Pending)
        .get();

      const vcs = snapshot.docs.map((doc) => ({
        ...doc.data(),
        issuedAt: doc.data().issuedAt.toDate(),
      })) as VCDataDto[];

      this.logger.log(`Found ${vcs.length} pending VCs for email: ${email}`);
      return vcs;
    } catch (error) {
      this.logger.error(
        `Failed to fetch pending VCs: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async activateVC(vcId: string): Promise<void> {
    this.logger.debug(`Activating VC: ${vcId}`);
    try {
      const vcRef = this.firestore.getFirestore().collection('vcs').doc(vcId);
      await vcRef.update({ status: VCStatus.Active });
      this.logger.log(`VC activated successfully: ${vcId}`);
    } catch (error) {
      this.logger.error(`Failed to activate VC: ${error.message}`, error.stack);
      throw error;
    }
  }

  async revokeVC(vcId: string): Promise<void> {
    this.logger.debug(`Revoking VC: ${vcId}`);
    try {
      const vcRef = this.firestore.getFirestore().collection('vcs').doc(vcId);
      await vcRef.update({ status: VCStatus.Revoked });
      this.logger.log(`VC revoked successfully: ${vcId}`);
    } catch (error) {
      this.logger.error(`Failed to revoke VC: ${error.message}`, error.stack);
      throw error;
    }
  }
}
