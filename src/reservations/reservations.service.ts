import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { FirestoreProvider } from '../shared/firestore/firestore.provider';
import { VcsService } from '../vcs/vcs.service';
import { CreateReservationDto } from './dto/create-reservation.dto';

@Injectable()
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);

  constructor(
    private readonly firestore: FirestoreProvider,
    private readonly vcsService: VcsService,
  ) {}

  async createReservation(dto: CreateReservationDto): Promise<void> {
    this.logger.debug(`Creating reservation for user: ${dto.user_id}`);

    // ユーザーのメールアドレスを取得
    const userDoc = await this.firestore
      .getFirestore()
      .collection('users')
      .where('onpakuUserId', '==', dto.user_id)
      .get();

    if (userDoc.empty) {
      this.logger.error(`User not found: ${dto.user_id}`);
      throw new NotFoundException(`User with ID ${dto.user_id} not found`);
    }

    const userEmail = userDoc.docs[0].id;

    try {
      // 予約情報を保存
      const reservationRef = this.firestore
        .getFirestore()
        .collection('reservations')
        .doc(dto.reservation_id);

      await reservationRef.set({
        userEmail,
        executionId: dto.execution.id,
        programId: dto.execution.program_id,
        startTime: new Date(dto.execution.start_time),
        endTime: new Date(dto.execution.end_time),
        capacity: dto.execution.capacity,
        price: dto.execution.price,
        createdAt: new Date(),
      });

      this.logger.debug(
        `Reservation created: ${dto.reservation_id} for user: ${userEmail}`,
      );

      // イベントVCを作成
      await this.vcsService.createEventVC(userEmail, {
        reservationId: dto.reservation_id,
        programId: dto.execution.program_id,
        startTime: dto.execution.start_time,
        endTime: dto.execution.end_time,
        price: dto.execution.price,
      });

      this.logger.debug(
        `Event VC created for reservation: ${dto.reservation_id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create reservation: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
