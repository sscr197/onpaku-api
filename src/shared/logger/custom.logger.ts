import { ConsoleLogger, Injectable, Scope, LogLevel } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class CustomLogger extends ConsoleLogger {
  constructor() {
    super({
      timestamp: true,
      prefix: 'Onpaku',
    });
  }

  log(message: string, context?: string) {
    super.log(message, context);
  }

  error(message: string, stack?: string, context?: string) {
    super.error(message, stack, context);
  }

  warn(message: string, context?: string) {
    super.warn(message, context);
  }

  debug(message: string, context?: string) {
    super.debug(message, context);
  }

  verbose(message: string, context?: string) {
    super.verbose(message, context);
  }

  setLogLevels(levels: LogLevel[]) {
    super.setLogLevels(levels);
  }
}
