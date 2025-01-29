import { INestApplication, ValidationPipe } from '@nestjs/common';
import { MockAuthGuard } from './mocks/auth.guard.mock';

export function setupTestApp(app: INestApplication): void {
  app.useGlobalGuards(new MockAuthGuard());

  // ValidationPipeの設定を追加
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
}
