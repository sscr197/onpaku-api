import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor';
import { CustomLogger } from './shared/logger/custom.logger';
import { FirestoreProvider } from './shared/firestore/firestore.provider';

function logEnvVariables(logger: CustomLogger): void {
  logger.log('----- Environment Variables -----');
  logger.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  logger.log(`PORT: ${process.env.PORT}`);
  logger.log(`API_KEY: ${process.env.API_KEY}`);
  logger.log(`APP_NAME: ${process.env.APP_NAME}`);
  logger.log(`FIRESTORE_EMULATOR_HOST: ${process.env.FIRESTORE_EMULATOR_HOST}`);
  logger.log(`FIRESTORE_PROJECT_ID: ${process.env.FIRESTORE_PROJECT_ID}`);
  logger.log(`FIRESTORE_CLIENT_EMAIL: ${process.env.FIRESTORE_CLIENT_EMAIL}`);
  logger.log(`FIRESTORE_PRIVATE_KEY: ${process.env.FIRESTORE_PRIVATE_KEY}`);
  logger.log(`FIRESTORE_DATABASE_ID: ${process.env.FIRESTORE_DATABASE_ID}`);
  logger.log(`FIREBASE_DATABASE_URL: ${process.env.FIREBASE_DATABASE_URL}`);
  logger.log('----- End of Environment Variables -----\n');
}

async function checkFirebaseConnection(
  logger: CustomLogger,
  firestoreProvider: FirestoreProvider,
) {
  try {
    const db = firestoreProvider.getFirestore();
    const collections = await db.listCollections();
    logger.log(
      'Firestore collections:',
      collections.map((col) => col.id).join(', '),
    );
  } catch (error) {
    logger.error('Error during Firestore access:', error);
    throw error;
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // CORSを有効化
  app.enableCors();

  // カスタムロガーを設定
  const logger = await app.resolve(CustomLogger);
  app.useLogger(logger);

  // グローバルなバリデーションパイプ、エラーフィルター、インターセプターの設定
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger設定
  const config = new DocumentBuilder()
    .setTitle('Onpaku API')
    .setDescription('オンパクアプリケーションのAPI仕様書')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // アプリケーションの初期化（全ライフサイクルフックを実行）
  await app.init();

  // FirestoreProvider を解決（この時点で onModuleInit がすでに実行されているので、this.db が正しくセットされているはず）
  const firestoreProvider = await app.resolve(FirestoreProvider);

  // 環境変数が正しくセットされているか（このログで秘密鍵なども確認）
  logEnvVariables(logger);

  // Firebase に接続できるか確認
  await checkFirebaseConnection(logger, firestoreProvider);

  const port = process.env.PORT ?? 8080;
  await app.listen(port, '0.0.0.0');
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Swagger UI is available at http://localhost:${port}/docs`);
}
bootstrap();
