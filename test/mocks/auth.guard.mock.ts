import { ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class MockAuthGuard {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    request.user = {
      email: 'test@example.com',
      sub: 'test-user-id',
    };
    return true;
  }
}
