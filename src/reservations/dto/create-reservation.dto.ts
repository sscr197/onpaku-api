import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class Execution {
  @ApiProperty({
    description: '実施回ID',
    example: 'execution123',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'プログラムID',
    example: 'program123',
  })
  @IsString()
  program_id: string;

  @ApiProperty({
    description: '開始時間',
    example: '2024-02-01T10:00:00+09:00',
  })
  @IsDateString()
  start_time: string;

  @ApiProperty({
    description: '終了時間',
    example: '2024-02-01T12:00:00+09:00',
  })
  @IsDateString()
  end_time: string;

  @ApiProperty({
    description: '定員',
    example: 10,
  })
  @IsNumber()
  capacity: number;

  @ApiProperty({
    description: '料金',
    example: 5000,
  })
  @IsNumber()
  price: number;
}

export class CreateReservationDto {
  @ApiProperty({
    description: '予約ID',
    example: 'reservation123',
  })
  @IsString()
  reservation_id: string;

  @ApiProperty({
    description: 'ユーザーID',
    example: 'user123',
  })
  @IsString()
  user_id: string;

  @ApiProperty({
    description: '実施回情報',
    type: Execution,
  })
  @ValidateNested()
  @Type(() => Execution)
  execution: Execution;
}
