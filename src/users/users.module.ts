import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { FirestoreModule } from '../shared/firestore/firestore.module';
import { VcsModule } from '../vcs/vcs.module';
import { LoggerModule } from '../shared/logger/logger.module';
import { ProgramsModule } from '../programs/programs.module';

@Module({
  imports: [FirestoreModule, VcsModule, LoggerModule, ProgramsModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
