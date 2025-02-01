import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirestoreProvider implements OnModuleInit {
  private db: FirebaseFirestore.Firestore;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
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

    this.db = admin.firestore();

    // Firestoreの詳細設定
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
