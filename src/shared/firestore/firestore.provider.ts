import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirestoreProvider implements OnModuleInit {
  private db: FirebaseFirestore.Firestore;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    // アプリケーションが初期化されていない場合のみ初期化
    if (admin.apps.length === 0) {
      const projectId = this.configService.get<string>('FIRESTORE_PROJECT_ID');

      // 開発環境（エミュレータ）の場合
      if (this.configService.get('FIRESTORE_EMULATOR_HOST')) {
        process.env.FIRESTORE_EMULATOR_HOST = this.configService.get(
          'FIRESTORE_EMULATOR_HOST',
        );
        admin.initializeApp({
          projectId,
        });
      } else {
        // 本番環境の場合は、環境変数から認証情報を読み込む
        const clientEmail = this.configService.get<string>(
          'FIRESTORE_CLIENT_EMAIL',
        );
        const privateKey = this.configService.get<string>(
          'FIRESTORE_PRIVATE_KEY',
        );

        if (!clientEmail || !privateKey) {
          throw new Error('Firestore credentials are not properly configured');
        }

        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
        });
      }
    }

    this.db = admin.firestore();
  }

  getFirestore(): FirebaseFirestore.Firestore {
    return this.db;
  }
}
