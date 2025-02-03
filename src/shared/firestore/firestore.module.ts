import { Module } from '@nestjs/common';
import { FirestoreProvider } from './firestore.provider';
import { LoggerModule } from '../logger/logger.module'; // 追加

@Module({
  imports: [LoggerModule], // LoggerModule をインポートして、CustomLogger を利用できるようにする
  providers: [FirestoreProvider],
  exports: [FirestoreProvider],
})
export class FirestoreModule {}
