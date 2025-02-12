import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  IsObject,
  IsEmail,
  IsEnum,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PartnerUser {
  @ApiProperty({
    description: 'パートナーのメールアドレス',
    example: 'test@example.com',
    required: true,
    format: 'email',
  })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'パートナーの役割',
    example: 'owner',
    required: true,
    enum: ['owner', 'staff', 'helper'],
  })
  @IsString()
  @IsEnum(['owner', 'staff', 'helper'])
  role: string;
}

export class Program {
  @ApiProperty({
    description: 'プログラムID',
    example: 'program123',
    required: true,
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'プログラムタイトル',
    example: 'サンプルプログラム',
    required: true,
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'プログラムサブタイトル',
    example: 'プログラムのサブタイトル',
    required: true,
    minLength: 1,
    maxLength: 200,
  })
  @IsString()
  sub_title: string;

  @ApiProperty({
    description: 'プログラム番号',
    example: 1,
    required: true,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  number: number;

  @ApiProperty({
    description: '緯度（日本国内の範囲）',
    example: 35.6895,
    required: true,
    minimum: 20,
    maximum: 46,
  })
  @IsNumber()
  @Min(20)
  @Max(46)
  latitude: number;

  @ApiProperty({
    description: '経度（日本国内の範囲）',
    example: 139.6917,
    required: true,
    minimum: 122,
    maximum: 154,
  })
  @IsNumber()
  @Min(122)
  @Max(154)
  longitude: number;

  @ApiProperty({
    description: '場所名',
    example: '渋谷スクランブルスクエア',
    required: true,
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  place_name: string;

  @ApiProperty({
    description: '郵便番号（ハイフン含む）',
    example: '150-0002',
    required: true,
    pattern: '^\\d{3}-\\d{4}$',
  })
  @IsString()
  @Matches(/^\d{3}-\d{4}$/)
  zip: string;

  @ApiProperty({
    description: '都道府県',
    example: '東京都',
    required: true,
  })
  @IsString()
  prefecture: string;

  @ApiProperty({
    description: '市区町村',
    example: '渋谷区',
    required: true,
  })
  @IsString()
  address: string;

  @ApiProperty({
    description: '番地以降',
    example: '渋谷2-24-12',
    required: true,
  })
  @IsString()
  street: string;
}

export class CreateProgramDto {
  @ApiProperty({
    description: 'プログラム情報',
    type: Program,
    required: true,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => Program)
  program: Program;

  @ApiProperty({
    description: 'パートナーユーザー一覧',
    type: [PartnerUser],
    required: true,
    example: [
      {
        email: 'owner@example.com',
        role: 'owner',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartnerUser)
  partner_users: PartnerUser[];
}
