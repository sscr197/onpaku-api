import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional } from 'class-validator';
import { ProgramRef } from './create-user.dto';

export class UpdateUserDto {
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
  @IsOptional()
  family_name?: string;

  @ApiProperty({
    description: '名',
    example: '次郎',
  })
  @IsString()
  @IsOptional()
  first_name?: string;

  @ApiProperty({
    description: '管理プログラム一覧',
    type: [ProgramRef],
    example: [{ programId: 'program123', role: 'partner' }],
  })
  @IsArray()
  @IsOptional()
  management_programs?: ProgramRef[];
}
