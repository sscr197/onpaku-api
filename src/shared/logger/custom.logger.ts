import { ConsoleLogger, Injectable, Scope, LogLevel } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class CustomLogger extends ConsoleLogger {
  constructor() {
    super({
      timestamp: true,
      prefix: 'Onpaku',
    });
  }

  protected formatMessage(message: any, context?: string): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}] ` : '';
    const messageStr =
      typeof message === 'object' ? JSON.stringify(message, null, 2) : message;
    return `${timestamp} ${contextStr}${messageStr}`;
  }

  log(message: any, context?: string) {
    super.log(this.formatMessage(message, context));
  }

  error(message: any, stack?: string, context?: string) {
    const formattedMessage = this.formatMessage(message, context);
    super.error(formattedMessage, stack);
  }

  warn(message: any, context?: string) {
    super.warn(this.formatMessage(message, context));
  }

  debug(message: any, context?: string) {
    super.debug(this.formatMessage(message, context));
  }

  verbose(message: any, context?: string) {
    super.verbose(this.formatMessage(message, context));
  }

  setLogLevels(levels: LogLevel[]) {
    super.setLogLevels(levels);
  }
}
