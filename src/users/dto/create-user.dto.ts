import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsOptional } from 'class-validator';

export class ProgramRef {
  @ApiProperty({
    description: 'プログラムID',
    example: 'program123',
    required: true,
  })
  @IsString()
  programId: string;

  @ApiProperty({
    description: 'プログラムでの役割（partner, organizer など）',
    example: 'partner',
    required: true,
  })
  @IsString()
  role: string;
}

export class CreateUserDto {
  @ApiProperty({
    description: 'オンパク側ユーザーID',
    example: 'user123',
    required: true,
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'メールアドレス',
    example: 'test@example.com',
    required: true,
    format: 'email',
  })
  @IsString()
  email: string;

  @ApiProperty({
    description: '姓',
    example: '山田',
    required: true,
  })
  @IsString()
  family_name: string;

  @ApiProperty({
    description: '名',
    example: '太郎',
    required: true,
  })
  @IsString()
  first_name: string;

  @ApiProperty({
    description: '生年',
    example: 1990,
    minimum: 1900,
    maximum: new Date().getFullYear(),
    required: true,
  })
  @IsNumber()
  birth_year: number;

  @ApiProperty({
    description: '性別',
    example: 'male',
    enum: ['male', 'female', 'other'],
    required: true,
  })
  @IsString()
  gender: string;

  @ApiProperty({
    description: '郵便番号（ハイフン含む）',
    example: '123-4567',
    pattern: '^\\d{3}-\\d{4}$',
    required: true,
  })
  @IsString()
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
    example: '1-2-3',
    required: true,
  })
  @IsString()
  street: string;

  @ApiProperty({
    description: '電話番号（ハイフン含む）',
    example: '03-1234-5678',
    pattern: '^\\d{2,4}-\\d{2,4}-\\d{4}$',
    required: true,
  })
  @IsString()
  tel: string;

  @ApiProperty({
    description: '管理プログラム一覧',
    type: [ProgramRef],
    required: false,
    example: [{ programId: 'program123', role: 'partner' }],
  })
  @IsArray()
  @IsOptional()
  management_programs: ProgramRef[];
}
