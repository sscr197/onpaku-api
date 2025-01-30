import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor';
import { CustomLogger } from './shared/logger/custom.logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // カスタムロガーを設定
  const logger = await app.resolve(CustomLogger);
  app.useLogger(logger);

  // 開発環境の場合はデバッグログを有効化
  if (process.env.NODE_ENV !== 'production') {
    logger.setLogLevels(['debug', 'verbose', 'log', 'warn', 'error']);
  } else {
    // 本番環境では重要なログのみ
    logger.setLogLevels(['log', 'warn', 'error']);
  }

  // バリデーションパイプをグローバルに設定
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // エラーフィルターをグローバルに設定
  app.useGlobalFilters(new HttpExceptionFilter());

  // ロギングインターセプターをグローバルに設定
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

  const port = process.env.PORT ?? 8080;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
