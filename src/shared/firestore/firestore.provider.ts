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
  ) {
    this.logger.setContext(FirestoreProvider.name);
  }

  private async testEmulatorConnection(): Promise<void> {
    try {
      const testRef = this.db.collection('_test_').doc('_test_');
      this.logger.debug('Testing emulator connection with test document...');

      await testRef.set({ test: true });
      this.logger.debug('Successfully wrote test document');

      const doc = await testRef.get();
      this.logger.debug(
        `Test document exists: ${doc.exists}, data: ${JSON.stringify(doc.data())}`,
      );

      await testRef.delete();
      this.logger.debug('Successfully deleted test document');

      this.logger.debug('Emulator connection test completed successfully');
    } catch (error) {
      this.logger.error(
        `Failed to test emulator connection: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async onModuleInit() {
    const existingApp = admin.apps.find((app) => app?.name === this.appName);
    if (existingApp) {
      this.logger.warn(
        `Firebase app "${this.appName}" already exists. Deleting it to reinitialize.`,
        'FirestoreProvider',
      );
      await existingApp.delete();
    }

    const nodeEnv = this.configService.get<string>('NODE_ENV');
    const projectId = this.configService.get<string>('FIRESTORE_PROJECT_ID');

    this.logger.debug(
      `Initializing Firestore with NODE_ENV=${nodeEnv}, ProjectID=${projectId}`,
    );

    if (!projectId) {
      throw new Error('FIRESTORE_PROJECT_ID is not configured');
    }

    // development環境の場合はエミュレーターを使用
    if (nodeEnv === 'development' || nodeEnv === 'test') {
      const emulatorHost =
        this.configService.get<string>('FIRESTORE_EMULATOR_HOST') ||
        'localhost:8080';

      this.logger.debug(`Using emulator mode with host: ${emulatorHost}`);

      try {
        admin.initializeApp(
          {
            projectId,
          },
          this.appName,
        );

        this.db = admin.app(this.appName).firestore();

        this.logger.debug('Setting up Firestore emulator configuration');
        this.db.settings({
          host: emulatorHost,
          ssl: false,
          ignoreUndefinedProperties: true,
        });

        // エミュレーターへの接続テスト
        await this.testEmulatorConnection();

        this.logger.debug('Firestore emulator connection established');
      } catch (error) {
        this.logger.error(
          `Failed to initialize Firestore in emulator mode: ${error.message}`,
          error.stack,
        );
        throw error;
      }
    } else {
      this.logger.debug(
        'Using production mode with credentials',
        'FirestoreProvider',
      );

      // 本番環境用の初期化
      const clientEmail = this.configService.get<string>(
        'FIRESTORE_CLIENT_EMAIL',
      );
      const privateKey = this.configService.get<string>(
        'FIRESTORE_PRIVATE_KEY',
      );
      const databaseUrl = this.configService.get<string>(
        'FIREBASE_DATABASE_URL',
      );
      const databaseId = this.configService.get<string>(
        'FIRESTORE_DATABASE_ID',
      );

      if (!clientEmail || !privateKey) {
        throw new Error('Firestore credentials are not properly configured');
      }

      const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

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

      this.db = admin.app(this.appName).firestore();

      if (databaseId) {
        this.db.settings({
          databaseId,
          ignoreUndefinedProperties: true,
        });
      }

      this.logger.debug(
        'Firestore production connection established',
        'FirestoreProvider',
      );
    }
  }

  getFirestore(): FirebaseFirestore.Firestore {
    if (!this.db) {
      this.logger.error('Firestore instance is not initialized');
      throw new Error('Firestore instance is not initialized');
    }
    this.logger.debug('Returning Firestore instance');
    return this.db;
  }
}
