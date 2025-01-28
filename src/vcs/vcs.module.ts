import { Module } from '@nestjs/common';
import { VcsService } from './vcs.service';
import { VcsController } from './vcs.controller';
import { FirestoreModule } from '../shared/firestore/firestore.module';

@Module({
  imports: [FirestoreModule],
  providers: [VcsService],
  controllers: [VcsController],
  exports: [VcsService],
})
export class VcsModule {}
