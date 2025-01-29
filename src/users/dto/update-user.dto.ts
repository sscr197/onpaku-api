import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional } from 'class-validator';
import { ProgramRef } from './create-user.dto';

export class UpdateUserDto {
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
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  family_name?: string;

  @ApiProperty({
    description: '名',
    example: '次郎',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  first_name?: string;

  @ApiProperty({
    description: '管理プログラム一覧',
    type: [ProgramRef],
    required: false,
    nullable: true,
    example: [{ programId: 'program123', role: 'organizer' }],
  })
  @IsArray()
  @IsOptional()
  management_programs?: ProgramRef[];
}
