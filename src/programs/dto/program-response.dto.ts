import { ApiProperty } from '@nestjs/swagger';
import { UpdatePartnerUserDto } from './update-program.dto';

export class ProgramDataResponseDto {
  @ApiProperty({
    description: 'プログラムID',
    example: 'program123',
  })
  id: string;

  @ApiProperty({
    description: 'プログラムタイトル',
    example: 'サンプルプログラム',
  })
  title: string;

  @ApiProperty({
    description: 'プログラムサブタイトル',
    example: 'プログラムのサブタイトル',
  })
  sub_title: string;

  @ApiProperty({
    description: 'プログラム番号',
    example: 1,
  })
  number: number;

  @ApiProperty({
    description: '緯度（日本国内の範囲）',
    example: 35.6895,
  })
  latitude: number;

  @ApiProperty({
    description: '経度（日本国内の範囲）',
    example: 139.6917,
  })
  longitude: number;

  @ApiProperty({
    description: '場所名',
    example: '渋谷スクランブルスクエア',
  })
  place_name: string;

  @ApiProperty({
    description: '郵便番号（ハイフン含む）',
    example: '150-0002',
  })
  zip: string;

  @ApiProperty({
    description: '都道府県',
    example: '東京都',
  })
  prefecture: string;

  @ApiProperty({
    description: '市区町村',
    example: '渋谷区',
  })
  address: string;

  @ApiProperty({
    description: '番地以降',
    example: '渋谷2-24-12',
  })
  street: string;
}

export class ProgramResponseDto {
  @ApiProperty({
    description: 'プログラム情報',
    type: ProgramDataResponseDto,
  })
  program: ProgramDataResponseDto;

  @ApiProperty({
    description: 'パートナーユーザー一覧',
    type: [UpdatePartnerUserDto],
  })
  partner_users: UpdatePartnerUserDto[];
}
