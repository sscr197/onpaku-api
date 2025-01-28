import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ConfigModule } from './config/config.module';
import { VcsModule } from './vcs/vcs.module';
import { FirestoreModule } from './shared/firestore/firestore.module';
import { ReservationsModule } from './reservations/reservations.module';
import { LoggerModule } from './shared/logger/logger.module';

@Module({
  imports: [
    ConfigModule,
    FirestoreModule,
    LoggerModule,
    UsersModule,
    VcsModule,
    ReservationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
