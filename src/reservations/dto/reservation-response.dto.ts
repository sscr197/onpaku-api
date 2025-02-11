import { ApiProperty } from '@nestjs/swagger';

export class ExecutionDto {
  @ApiProperty({
    description: '実施ID',
    example: 'exec-a-1',
  })
  id: string;

  @ApiProperty({
    description: 'プログラムID',
    example: 'program123',
  })
  program_id: string;

  @ApiProperty({
    description: '開始時間',
    example: '2025-05-01T10:00:00+09:00',
  })
  start_time: string;

  @ApiProperty({
    description: '終了時間',
    example: '2025-05-01T12:00:00+09:00',
  })
  end_time: string;

  @ApiProperty({
    description: '定員',
    example: 30,
  })
  capacity: number;

  @ApiProperty({
    description: '価格',
    example: 5000,
  })
  price: number;
}

export class ReservationResponseDto {
  @ApiProperty({
    description: '予約ID',
    example: 'reservation123',
  })
  reservation_id: string;

  @ApiProperty({
    description: '予約者のメールアドレス',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: '実施情報',
    type: ExecutionDto,
  })
  execution: ExecutionDto;
}
