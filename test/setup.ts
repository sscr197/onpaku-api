import { INestApplication, ValidationPipe } from '@nestjs/common';
import { MockAuthGuard } from './mocks/auth.guard.mock';
import { Test } from 'supertest';

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

export function addAuthHeader(request: Test): Test {
  return request.set('Authorization', 'Bearer mock-jwt-token');
}
