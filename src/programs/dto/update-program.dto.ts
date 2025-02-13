import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePartnerUserDto {
  @ApiPropertyOptional({
    description: 'パートナーのメールアドレス',
    example: 'test@example.com',
    format: 'email',
  })
  @IsOptional()
  @IsString()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'パートナーの役割',
    example: 'owner',
    enum: ['owner', 'staff', 'helper'],
  })
  @IsOptional()
  @IsString()
  @IsEnum(['owner', 'staff', 'helper'])
  role?: string;
}

export class UpdateProgramDataDto {
  @ApiProperty({
    description: 'プログラムID',
    example: 'program123',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiPropertyOptional({
    description: 'プログラムタイトル',
    example: 'サンプルプログラム',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'プログラムサブタイトル',
    example: 'プログラムのサブタイトル',
  })
  @IsOptional()
  @IsString()
  sub_title?: string;

  @ApiPropertyOptional({
    description: 'プログラム番号',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  number?: number;

  @ApiPropertyOptional({
    description: '緯度（日本国内の範囲）',
    example: 35.6895,
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({
    description: '経度（日本国内の範囲）',
    example: 139.6917,
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({
    description: '場所名',
    example: '渋谷スクランブルスクエア',
  })
  @IsOptional()
  @IsString()
  place_name?: string;

  @ApiPropertyOptional({
    description: '郵便番号（ハイフン含む）',
    example: '150-0002',
  })
  @IsOptional()
  @IsString()
  zip?: string;

  @ApiPropertyOptional({
    description: '都道府県',
    example: '東京都',
  })
  @IsOptional()
  @IsString()
  prefecture?: string;

  @ApiPropertyOptional({
    description: '市区町村',
    example: '渋谷区',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: '番地以降',
    example: '渋谷2-24-12',
  })
  @IsOptional()
  @IsString()
  street?: string;
}

export class UpdateProgramDto {
  @ApiProperty({
    description: 'プログラム情報',
    type: UpdateProgramDataDto,
    required: true,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => UpdateProgramDataDto)
  program: UpdateProgramDataDto;

  @ApiPropertyOptional({
    description: 'パートナーユーザー一覧',
    type: [UpdatePartnerUserDto],
    example: [
      {
        email: 'owner@example.com',
        role: 'owner',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePartnerUserDto)
  partner_users?: UpdatePartnerUserDto[];
}
