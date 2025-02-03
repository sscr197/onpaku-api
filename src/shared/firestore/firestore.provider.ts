import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { CustomLogger } from '../logger/custom.logger';

@Injectable()
export class FirestoreProvider implements OnModuleInit {
  private db: FirebaseFirestore.Firestore;
  // 固有のアプリ名を指定
  private readonly appName = 'onpaku-app';

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: CustomLogger,
  ) {}

  async onModuleInit() {
    // 常に自分専用のアプリを初期化するため、既存の同名のアプリがあれば削除
    const existingApp = admin.apps.find((app) => app?.name === this.appName);
    if (existingApp) {
      this.logger.warn(
        `Firebase app "${this.appName}" already exists. Deleting it to reinitialize.`,
        'FirestoreProvider',
      );
      await existingApp.delete();
    }

    // 必要な設定値を取得
    const projectId = this.configService.get<string>('FIRESTORE_PROJECT_ID');
    const clientEmail = this.configService.get<string>(
      'FIRESTORE_CLIENT_EMAIL',
    );
    const privateKey = this.configService.get<string>('FIRESTORE_PRIVATE_KEY');
    const databaseUrl = this.configService.get<string>('FIREBASE_DATABASE_URL');
    const databaseId = this.configService.get<string>('FIRESTORE_DATABASE_ID');

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Firestore credentials are not properly configured');
    }

    // 秘密鍵の改行コードを変換
    const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

    // 名前付きで Firebase Admin SDK を初期化する
    admin.initializeApp(
      {
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: formattedPrivateKey,
        }),
        databaseURL: databaseUrl,
        projectId,
      },
      this.appName,
    );

    // 名前付きアプリから Firestore インスタンスを取得する
    this.db = admin.app(this.appName).firestore();

    // Firestore の詳細設定
    if (databaseId) {
      this.db.settings({
        databaseId,
        ignoreUndefinedProperties: true,
      });
    }

    this.logger.debug(
      'Firestore instance successfully retrieved',
      'FirestoreProvider',
    );
  }

  getFirestore(): FirebaseFirestore.Firestore {
    return this.db;
  }
}
