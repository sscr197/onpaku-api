import { Module } from '@nestjs/common';
import { ProgramsController } from './programs.controller';
import { ProgramsService } from './programs.service';
import { FirestoreModule } from '../shared/firestore/firestore.module';
import { VcsModule } from '../vcs/vcs.module';

@Module({
  imports: [FirestoreModule, VcsModule],
  controllers: [ProgramsController],
  providers: [ProgramsService],
  exports: [ProgramsService],
})
export class ProgramsModule {}
