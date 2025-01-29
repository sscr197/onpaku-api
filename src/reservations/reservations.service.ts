import { Injectable, NotFoundException } from '@nestjs/common';
import { FirestoreProvider } from '../shared/firestore/firestore.provider';
import { VcsService } from '../vcs/vcs.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { CustomLogger } from '../shared/logger/custom.logger';

@Injectable()
export class ReservationsService {
  constructor(
    private readonly firestore: FirestoreProvider,
    private readonly vcsService: VcsService,
    private readonly logger: CustomLogger,
  ) {
    this.logger.setContext(ReservationsService.name);
  }

  async createReservation(dto: CreateReservationDto): Promise<void> {
    this.logger.debug(`Creating reservation for user: ${dto.email}`);

    try {
      // 予約情報を保存
      const reservationRef = this.firestore
        .getFirestore()
        .collection('reservations')
        .doc(dto.reservation_id);

      await reservationRef.set({
        userEmail: dto.email,
        executionId: dto.execution.id,
        programId: dto.execution.program_id,
        startTime: new Date(dto.execution.start_time),
        endTime: new Date(dto.execution.end_time),
        capacity: dto.execution.capacity,
        price: dto.execution.price,
        createdAt: new Date(),
      });

      this.logger.debug(
        `Reservation created: ${dto.reservation_id} for user: ${dto.email}`,
      );

      // イベントVCを作成
      await this.vcsService.createEventVC(dto.email, {
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
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to create reservation: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
