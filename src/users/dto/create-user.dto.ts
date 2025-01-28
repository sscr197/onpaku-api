import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsOptional } from 'class-validator';

export class ProgramRef {
  @ApiProperty({
    description: 'プログラムID',
    example: 'program123',
  })
  @IsString()
  programId: string;

  @ApiProperty({
    description: 'プログラムでの役割',
    example: 'partner',
  })
  @IsString()
  role: string;
}

export class CreateUserDto {
  @ApiProperty({
    description: 'オンパク側ユーザーID',
    example: 'user123',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'メールアドレス',
    example: 'test@example.com',
  })
  @IsString()
  email: string;

  @ApiProperty({
    description: '姓',
    example: '山田',
  })
  @IsString()
  family_name: string;

  @ApiProperty({
    description: '名',
    example: '太郎',
  })
  @IsString()
  first_name: string;

  @ApiProperty({
    description: '生年',
    example: 1990,
  })
  @IsNumber()
  birth_year: number;

  @ApiProperty({
    description: '性別',
    example: 'male',
  })
  @IsString()
  gender: string;

  @ApiProperty({
    description: '郵便番号',
    example: '123-4567',
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
    example: '1-2-3',
  })
  @IsString()
  street: string;

  @ApiProperty({
    description: '電話番号',
    example: '03-1234-5678',
  })
  @IsString()
  tel: string;

  @ApiProperty({
    description: '管理プログラム一覧',
    type: [ProgramRef],
    example: [{ programId: 'program123', role: 'partner' }],
  })
  @IsArray()
  @IsOptional()
  management_programs: ProgramRef[];
}
