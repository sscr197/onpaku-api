// src/debug-firebase.ts
import * as admin from 'firebase-admin';
import { config } from 'dotenv';

// 環境変数の読み込み（Cloud Run でも環境変数は設定されているので不要な場合もありますが、ローカル検証用に）
config();

function logEnvVariables(): void {
  console.log('----- Environment Variables -----');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('PORT:', process.env.PORT);
  console.log('API_KEY:', process.env.API_KEY);
  console.log('APP_NAME:', process.env.APP_NAME);
  console.log('FIRESTORE_EMULATOR_HOST:', process.env.FIRESTORE_EMULATOR_HOST);
  console.log('FIRESTORE_PROJECT_ID:', process.env.FIRESTORE_PROJECT_ID);
  console.log(
    'FIRESTORE_CLIENT_EMAIL:',
    process.env.FIRESTORE_CLIENT_EMAIL ? 'SET' : 'NOT SET',
  );
  console.log(
    'FIRESTORE_PRIVATE_KEY:',
    process.env.FIRESTORE_PRIVATE_KEY ? 'SET' : 'NOT SET',
  );
  console.log('FIRESTORE_DATABASE_ID:', process.env.FIRESTORE_DATABASE_ID);
  console.log('FIREBASE_DATABASE_URL:', process.env.FIREBASE_DATABASE_URL);
  console.log('----- End of Environment Variables -----\n');
}

async function initFirebase(): Promise<FirebaseFirestore.Firestore> {
  const isEmulator =
    process.env.NODE_ENV === 'development' &&
    !!process.env.FIRESTORE_EMULATOR_HOST;

  if (isEmulator) {
    console.log(
      'Using Firestore Emulator at:',
      process.env.FIRESTORE_EMULATOR_HOST,
    );
    // エミュレータ利用時は projectId のみで OK
    admin.initializeApp({ projectId: process.env.FIRESTORE_PROJECT_ID });
  } else {
    // 本番環境用（エミュレータを使わない場合）
    if (
      !process.env.FIRESTORE_CLIENT_EMAIL ||
      !process.env.FIRESTORE_PRIVATE_KEY
    ) {
      throw new Error('Missing Firebase service account credentials');
    }
    const firebaseConfig = {
      credential: admin.credential.cert({
        projectId: process.env.FIRESTORE_PROJECT_ID,
        clientEmail: process.env.FIRESTORE_CLIENT_EMAIL,
        privateKey: process.env.FIRESTORE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
      projectId: process.env.FIRESTORE_PROJECT_ID,
    };
    console.log('Initializing Firebase Admin with config:', {
      projectId: firebaseConfig.projectId,
      clientEmail: firebaseConfig.credential ? 'SET' : 'NOT SET',
      databaseURL: firebaseConfig.databaseURL,
    });
    admin.initializeApp(firebaseConfig);
  }

  const db = admin.firestore();
  if (process.env.FIRESTORE_DATABASE_ID) {
    console.log(
      'Setting Firestore databaseId to:',
      process.env.FIRESTORE_DATABASE_ID,
    );
    db.settings({
      databaseId: process.env.FIRESTORE_DATABASE_ID,
      ignoreUndefinedProperties: true,
    });
  }
  return db;
}

async function main() {
  logEnvVariables();

  try {
    const db = await initFirebase();
    // Firestore 接続確認のため、現在のコレクション一覧を取得してログ出力
    const collections = await db.listCollections();
    console.log(
      'Firestore collections:',
      collections.map((col) => col.id),
    );
  } catch (error) {
    console.error(
      'Error during Firebase initialization or Firestore access:',
      error,
    );
    process.exit(1);
  }
}

main();
