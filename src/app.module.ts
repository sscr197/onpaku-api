import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ConfigModule } from './config/config.module';
import { VcsModule } from './vcs/vcs.module';

@Module({
  imports: [ConfigModule, UsersModule, VcsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
