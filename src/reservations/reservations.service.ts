import { Injectable, NotFoundException } from '@nestjs/common';
import { FirestoreProvider } from '../shared/firestore/firestore.provider';
import { VcsService } from '../vcs/vcs.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationResponseDto } from './dto/reservation-response.dto';
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

  async findReservationById(
    reservationId: string,
  ): Promise<ReservationResponseDto> {
    this.logger.debug(`Finding reservation by id: ${reservationId}`);
    try {
      const reservationRef = this.firestore
        .getFirestore()
        .collection('reservations')
        .doc(reservationId);
      const doc = await reservationRef.get();
      if (!doc.exists) {
        throw new NotFoundException(`Reservation ${reservationId} not found`);
      }
      const data = doc.data();

      // タイムゾーンを考慮した日時フォーマット
      const formatDate = (date: FirebaseFirestore.Timestamp) => {
        const d = date.toDate();
        const offset = 9 * 60; // JST (+9:00)
        const localDate = new Date(d.getTime() + offset * 60 * 1000);
        return localDate.toISOString().replace('.000Z', '+09:00');
      };

      return {
        reservation_id: doc.id,
        email: data?.userEmail,
        execution: {
          id: data?.executionId,
          program_id: data?.programId,
          start_time: formatDate(data?.startTime),
          end_time: formatDate(data?.endTime),
          capacity: data?.capacity,
          price: data?.price,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to find reservation by id: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
