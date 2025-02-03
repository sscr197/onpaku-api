// firestore.provider.ts（デバッグ用の一時コード例）
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { CustomLogger } from '../logger/custom.logger';

@Injectable()
export class FirestoreProvider implements OnModuleInit {
  private db: FirebaseFirestore.Firestore;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: CustomLogger, // カスタムロガーを注入
  ) {}

  onModuleInit() {
    // Firebase が初期化されていなければ
    if (admin.apps.length === 0) {
      const projectId = this.configService.get<string>('FIRESTORE_PROJECT_ID');
      const isEmulator = this.configService.get('NODE_ENV') === 'development';

      if (isEmulator && this.configService.get('FIRESTORE_EMULATOR_HOST')) {
        process.env.FIRESTORE_EMULATOR_HOST = this.configService.get(
          'FIRESTORE_EMULATOR_HOST',
        );
        admin.initializeApp({
          projectId,
        });
      } else {
        const clientEmail = this.configService.get<string>(
          'FIRESTORE_CLIENT_EMAIL',
        );
        const privateKey = this.configService.get<string>(
          'FIRESTORE_PRIVATE_KEY',
        );
        const databaseId = this.configService.get<string>(
          'FIRESTORE_DATABASE_ID',
        );
        const databaseUrl = this.configService.get<string>(
          'FIREBASE_DATABASE_URL',
        );

        if (!clientEmail || !privateKey || !projectId) {
          throw new Error('Firestore credentials are not properly configured');
        }

        // デバッグ目的で秘密鍵の変換前後をログ出力（開発環境でのみ出力するようにするのが望ましい）
        if (process.env.NODE_ENV !== 'production') {
          this.logger.debug(
            '--- FIRESTORE_PRIVATE_KEY Raw ---',
            'FirestoreProvider',
          );
          this.logger.debug(privateKey, 'FirestoreProvider');
          const privateKeyTransformed = privateKey.replace(/\\n/g, '\n');
          this.logger.debug(
            '--- FIRESTORE_PRIVATE_KEY Transformed ---',
            'FirestoreProvider',
          );
          this.logger.debug(privateKeyTransformed, 'FirestoreProvider');
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId,
              clientEmail,
              privateKey: privateKeyTransformed,
            }),
            databaseURL: databaseUrl,
            projectId,
          });
        } else {
          // 本番環境では変換処理は行うが、秘密鍵の内容はログ出力しない
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId,
              clientEmail,
              privateKey: privateKey.replace(/\\n/g, '\n'),
            }),
            databaseURL: databaseUrl,
            projectId,
          });
        }
      }
    }

    this.db = admin.firestore();

    const databaseId = this.configService.get<string>('FIRESTORE_DATABASE_ID');
    if (databaseId) {
      this.db.settings({
        databaseId,
        ignoreUndefinedProperties: true,
      });
    }
  }

  getFirestore(): FirebaseFirestore.Firestore {
    return this.db;
  }
}
