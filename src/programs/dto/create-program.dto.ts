import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PartnerUser {
  @ApiProperty({
    description: 'パートナーのメールアドレス',
    example: 'test@example.com',
  })
  @IsString()
  email: string;

  @ApiProperty({
    description: 'パートナーの役割',
    example: 'owner',
  })
  @IsString()
  role: string;
}

export class Program {
  @ApiProperty({
    description: 'プログラムID',
    example: 'program123',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'プログラムタイトル',
    example: 'サンプルプログラム',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'プログラムサブタイトル',
    example: 'プログラムのサブタイトル',
  })
  @IsString()
  sub_title: string;

  @ApiProperty({
    description: 'プログラム番号',
    example: 1,
  })
  @IsNumber()
  number: number;

  @ApiProperty({
    description: '緯度',
    example: 35.6895,
  })
  @IsNumber()
  latitude: number;

  @ApiProperty({
    description: '経度',
    example: 139.6917,
  })
  @IsNumber()
  longitude: number;

  @ApiProperty({
    description: '場所名',
    example: '渋谷スクランブルスクエア',
  })
  @IsString()
  place_name: string;

  @ApiProperty({
    description: '郵便番号',
    example: '150-0002',
  })
  @IsString()
  zip: string;

  @ApiProperty({
    description: '都道府県',
    example: '東京都',
  })
  @IsString()
  prefecture: string;

  @ApiProperty({
    description: '市区町村',
    example: '渋谷区',
  })
  @IsString()
  address: string;

  @ApiProperty({
    description: '番地以降',
    example: '渋谷2-24-12',
  })
  @IsString()
  street: string;
}

export class CreateProgramDto {
  @ApiProperty({
    description: 'プログラム情報',
    type: Program,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => Program)
  program: Program;

  @ApiProperty({
    description: 'パートナーユーザー一覧',
    type: [PartnerUser],
    example: [{ email: 'test@example.com', role: 'owner' }],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartnerUser)
  partner_users: PartnerUser[];
}
