import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  PORT: number;

  @IsString()
  API_KEY: string;

  @IsString()
  @IsOptional()
  FIRESTORE_EMULATOR_HOST?: string;

  @IsString()
  FIRESTORE_PROJECT_ID: string;

  @IsString()
  @IsOptional()
  FIRESTORE_CLIENT_EMAIL?: string;

  @IsString()
  @IsOptional()
  FIRESTORE_PRIVATE_KEY?: string;

  @IsString()
  APP_NAME: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
