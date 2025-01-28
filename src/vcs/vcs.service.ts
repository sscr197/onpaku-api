import { Injectable } from '@nestjs/common';
import { FirestoreProvider } from '../shared/firestore/firestore.provider';
import { VCDataDto, VCType, VCStatus } from './dto/vc-data.dto';

@Injectable()
export class VcsService {
  constructor(private readonly firestore: FirestoreProvider) {}

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
    const vcId = this.generateVcId(VCType.User, email);
    const vcRef = this.firestore.getFirestore().collection('vcs').doc(vcId);

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
  }

  async createPartnerVC(email: string, programData: any): Promise<void> {
    const vcId = this.generateVcId(VCType.Partner, email, programData.id);
    const vcRef = this.firestore.getFirestore().collection('vcs').doc(vcId);

    await vcRef.set({
      userEmail: email,
      type: VCType.Partner,
      vcData: programData,
      status: VCStatus.Pending,
      issuedAt: new Date(),
    });
  }

  async createEventVC(email: string, reservationData: any): Promise<void> {
    const vcId = this.generateVcId(
      VCType.Event,
      email,
      reservationData.reservationId,
    );
    const vcRef = this.firestore.getFirestore().collection('vcs').doc(vcId);

    await vcRef.set({
      userEmail: email,
      type: VCType.Event,
      vcData: reservationData,
      status: VCStatus.Pending,
      issuedAt: new Date(),
    });
  }

  async getPendingVCsByEmail(email: string): Promise<VCDataDto[]> {
    const snapshot = await this.firestore
      .getFirestore()
      .collection('vcs')
      .where('userEmail', '==', email)
      .where('status', '==', VCStatus.Pending)
      .get();

    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      issuedAt: doc.data().issuedAt.toDate(),
    })) as VCDataDto[];
  }

  async activateVC(vcId: string): Promise<void> {
    const vcRef = this.firestore.getFirestore().collection('vcs').doc(vcId);
    await vcRef.update({ status: VCStatus.Active });
  }

  async revokeVC(vcId: string): Promise<void> {
    const vcRef = this.firestore.getFirestore().collection('vcs').doc(vcId);
    await vcRef.update({ status: VCStatus.Revoked });
  }
}
