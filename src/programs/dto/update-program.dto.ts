import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  Matches,
  Min,
  Max,
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
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'プログラムサブタイトル',
    example: 'プログラムのサブタイトル',
    minLength: 1,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  sub_title?: string;

  @ApiPropertyOptional({
    description: 'プログラム番号',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  number?: number;

  @ApiPropertyOptional({
    description: '緯度（日本国内の範囲）',
    example: 35.6895,
    minimum: 20,
    maximum: 46,
  })
  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(46)
  latitude?: number;

  @ApiPropertyOptional({
    description: '経度（日本国内の範囲）',
    example: 139.6917,
    minimum: 122,
    maximum: 154,
  })
  @IsOptional()
  @IsNumber()
  @Min(122)
  @Max(154)
  longitude?: number;

  @ApiPropertyOptional({
    description: '場所名',
    example: '渋谷スクランブルスクエア',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  place_name?: string;

  @ApiPropertyOptional({
    description: '郵便番号（ハイフン含む）',
    example: '150-0002',
    pattern: '^\\d{3}-\\d{4}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{3}-\d{4}$/)
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
