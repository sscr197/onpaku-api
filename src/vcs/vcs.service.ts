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

  async getPendingVCsByEmailTransformed(email: string): Promise<any[]> {
    this.logger.debug(`Fetching pending VCs for email (transformed): ${email}`);
    try {
      const snapshot = await this.firestore
        .getFirestore()
        .collection('vcs')
        .where('userEmail', '==', email)
        .where('status', '==', VCStatus.Pending)
        .get();

      const docs = snapshot.docs;
      const results = await Promise.all(
        docs.map(async (doc) => {
          const data = doc.data();
          return this.transformVcDocument(doc.id, data);
        }),
      );
      return results.filter((r) => r !== null);
    } catch (error) {
      this.logger.error(
        `Failed to fetch pending VCs: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async transformVcDocument(
    documentId: string,
    data: any,
  ): Promise<any> {
    const { userEmail, type, status, vcData } = data;
    switch (type) {
      case VCType.User:
        return await this.buildUserVcResponse(
          documentId,
          userEmail,
          status,
          vcData,
        );
      case VCType.Partner:
        return await this.buildPartnerVcResponse(
          documentId,
          userEmail,
          status,
          vcData,
        );
      case VCType.Event:
        return await this.buildEventVcResponse(
          documentId,
          userEmail,
          status,
          vcData,
        );
      default:
        this.logger.warn(`Unknown VC type: ${type}, docId=${documentId}`);
        return null;
    }
  }

  private async buildUserVcResponse(
    documentId: string,
    email: string,
    status: string,
    vcData: any,
  ) {
    const userSnap = await this.firestore
      .getFirestore()
      .collection('users')
      .doc(email)
      .get();
    if (!userSnap.exists) {
      this.logger.warn(`User doc not found for email: ${email}`);
      return null;
    }
    const userInfo = userSnap.data();

    return {
      documentId,
      email,
      type: 'user',
      status,
      vcData: {
        type: 'OnpakuUser',
        onpakuUserId: userInfo?.onpakuUserId,
        familyName: userInfo?.familyName,
        firstName: userInfo?.firstName,
      },
    };
  }

  private async buildPartnerVcResponse(
    documentId: string,
    email: string,
    status: string,
    vcData: any,
  ) {
    const userSnap = await this.firestore
      .getFirestore()
      .collection('users')
      .doc(email)
      .get();
    let firstName = '';
    if (userSnap.exists) {
      const userData = userSnap.data();
      firstName = userData?.firstName || '';
    }

    const programId = vcData.id;
    const programSnap = await this.firestore
      .getFirestore()
      .collection('programs')
      .doc(programId)
      .get();
    let programTitle = '';
    let programPrefecture = '';
    if (programSnap.exists) {
      const pData = programSnap.data();
      programTitle = pData?.title || '';
      programPrefecture = pData?.prefecture || '';
    }

    return {
      documentId,
      email,
      type: 'partner',
      status,
      vcData: {
        type: 'OnpakuPartner',
        programId,
        programTitle,
        programPrefecture,
      },
    };
  }

  private async buildEventVcResponse(
    documentId: string,
    email: string,
    status: string,
    vcData: any,
  ) {
    const { programId, startTime, endTime } = vcData;
    const programSnap = await this.firestore
      .getFirestore()
      .collection('programs')
      .doc(programId)
      .get();
    let programTitle = '';
    let programPrefecture = '';
    if (programSnap.exists) {
      const pData = programSnap.data();
      programTitle = pData?.title || '';
      programPrefecture = pData?.prefecture || '';
    }

    return {
      documentId,
      email,
      type: 'event',
      status,
      vcData: {
        type: 'OnpakuEvent',
        programId,
        programTitle,
        programPrefecture,
        startTime,
        endTime,
      },
    };
  }

  async updateVcStatus(documentId: string, status: VCStatus): Promise<void> {
    this.logger.debug(
      `Updating VC status: docId=${documentId}, status=${status}`,
    );
    try {
      const vcRef = this.firestore
        .getFirestore()
        .collection('vcs')
        .doc(documentId);
      await vcRef.update({ status });
      this.logger.log(`VC status updated successfully: ${documentId}`);
    } catch (error) {
      this.logger.error(
        `Failed to update VC status: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
