import { Module } from '@nestjs/common';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { FirestoreModule } from '../shared/firestore/firestore.module';
import { VcsModule } from '../vcs/vcs.module';

@Module({
  imports: [FirestoreModule, VcsModule],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
