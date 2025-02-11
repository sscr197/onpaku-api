import { ApiProperty } from '@nestjs/swagger';

export class ProgramRefDto {
  @ApiProperty({
    description: 'プログラムID',
    example: 'program123',
  })
  programId: string;

  @ApiProperty({
    description: 'ユーザーの役割',
    example: 'owner',
    enum: ['owner', 'staff', 'helper'],
  })
  role: string;
}

export class UserResponseDto {
  @ApiProperty({
    description: 'ユーザーID',
    example: 'user123',
  })
  id: string;

  @ApiProperty({
    description: 'メールアドレス',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: '姓',
    example: '山田',
  })
  family_name: string;

  @ApiProperty({
    description: '名',
    example: '太郎',
  })
  first_name: string;

  @ApiProperty({
    description: '生年',
    example: 1980,
  })
  birth_year: number;

  @ApiProperty({
    description: '性別',
    example: 'male',
    enum: ['male', 'female', 'other'],
  })
  gender: string;

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

  @ApiProperty({
    description: '電話番号',
    example: '03-1234-5678',
  })
  tel: string;

  @ApiProperty({
    description: '管理プログラム一覧',
    type: [ProgramRefDto],
  })
  management_programs: ProgramRefDto[];
}
