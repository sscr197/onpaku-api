import { IsDate, IsEnum, IsObject, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum VCType {
  User = 'user',
  Partner = 'partner',
  Event = 'event',
}

export enum VCStatus {
  Pending = 'pending',
  Active = 'active',
  Revoked = 'revoked',
}

export class VCDataDto {
  @ApiProperty({
    description: 'ユーザーのメールアドレス',
    example: 'test@example.com',
  })
  @IsString()
  userEmail: string;

  @ApiProperty({
    description: 'VCのタイプ',
    enum: VCType,
    example: VCType.User,
  })
  @IsEnum(VCType)
  type: VCType;

  @ApiProperty({
    description: 'VC固有のデータ',
    example: { id: '1234567890', name: 'テストユーザー' },
  })
  @IsObject()
  vcData: any;

  @ApiProperty({
    description: 'VCのステータス',
    enum: VCStatus,
    example: VCStatus.Pending,
  })
  @IsEnum(VCStatus)
  status: VCStatus;

  @ApiProperty({
    description: 'VCの発行日時',
    example: new Date().toISOString(),
  })
  @IsDate()
  issuedAt: Date;
}
