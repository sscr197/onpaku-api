import { Module } from '@nestjs/common';
import { VcsController } from './vcs.controller';
import { VcsService } from './vcs.service';

@Module({
  controllers: [VcsController],
  providers: [VcsService]
})
export class VcsModule {}
