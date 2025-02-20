import {
  IsDate,
  IsEnum,
  IsObject,
  IsString,
  IsEmail,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum VCType {
  User = 'user',
  Partner = 'partner',
  Event = 'event',
}

export enum VCStatus {
  Pending = 'pending',
  Completed = 'completed',
  Failed = 'failed',
  InProgress = 'in-progress',
}

export class VCDataDto {
  @ApiProperty({
    description: 'ユーザーのメールアドレス',
    example: 'test@example.com',
    required: true,
    format: 'email',
  })
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  userEmail: string;

  @ApiProperty({
    description:
      'VCのタイプ（user: ユーザー証明書, partner: パートナー証明書, event: イベント参加証明書）',
    enum: VCType,
    example: VCType.User,
    required: true,
    enumName: 'VCType',
  })
  @IsEnum(VCType)
  @IsNotEmpty()
  type: VCType;

  @ApiProperty({
    description: 'VC固有のデータ（タイプに応じて異なる構造のJSONオブジェクト）',
    example: {
      id: '1234567890',
      name: 'テストユーザー',
      role: 'member',
      attributes: {
        verified: true,
        level: 1,
      },
    },
    required: true,
  })
  @IsObject()
  @IsNotEmpty()
  vcData: Record<string, any>;

  @ApiProperty({
    description:
      'VCのステータス（pending: 発行済み未有効化, completed: 完了, failed: 失敗, in-progress: vc発行中）',
    enum: VCStatus,
    example: VCStatus.Pending,
    required: true,
    enumName: 'VCStatus',
  })
  @IsEnum(VCStatus)
  @IsNotEmpty()
  status: VCStatus;

  @ApiProperty({
    description: 'VCの発行日時（ISO8601形式）',
    example: '2024-02-01T10:00:00.000Z',
    required: true,
    format: 'date-time',
  })
  @IsDate()
  @IsNotEmpty()
  issuedAt: Date;
}
