import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsDateString,
  ValidateNested,
  Min,
  IsPositive,
  IsISO8601,
} from 'class-validator';
import { Type } from 'class-transformer';

export class Execution {
  @ApiProperty({
    description: '実施回ID',
    example: 'execution123',
    required: true,
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'プログラムID',
    example: 'program123',
    required: true,
  })
  @IsString()
  program_id: string;

  @ApiProperty({
    description: '開始時間（ISO8601形式、タイムゾーン付き）',
    example: '2024-02-01T10:00:00+09:00',
    required: true,
    format: 'date-time',
  })
  @IsDateString()
  @IsISO8601({ strict: true })
  start_time: string;

  @ApiProperty({
    description: '終了時間（ISO8601形式、タイムゾーン付き）',
    example: '2024-02-01T12:00:00+09:00',
    required: true,
    format: 'date-time',
  })
  @IsDateString()
  @IsISO8601({ strict: true })
  end_time: string;

  @ApiProperty({
    description: '定員（1以上の整数）',
    example: 10,
    required: true,
    minimum: 1,
  })
  @IsNumber()
  @IsPositive()
  @Min(1)
  capacity: number;

  @ApiProperty({
    description: '料金（0以上の整数、単位: 円）',
    example: 5000,
    required: true,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  price: number;
}

export class CreateReservationDto {
  @ApiProperty({
    description: '予約ID',
    example: 'reservation123',
    required: true,
  })
  @IsString()
  reservation_id: string;

  @ApiProperty({
    description: 'ユーザーID',
    example: 'user123',
    required: true,
  })
  @IsString()
  user_id: string;

  @ApiProperty({
    description: '実施回情報',
    type: Execution,
    required: true,
  })
  @ValidateNested()
  @Type(() => Execution)
  execution: Execution;
}
