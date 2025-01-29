import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ApiKeyGuard } from '../shared/guards/api-key.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CustomLogger } from '../shared/logger/custom.logger';

@ApiTags('Reservations')
@ApiBearerAuth('api-key')
@Controller('api/v1/onpaku/reservations')
@UseGuards(ApiKeyGuard)
export class ReservationsController {
  constructor(
    private readonly reservationsService: ReservationsService,
    private readonly logger: CustomLogger,
  ) {
    this.logger.setContext(ReservationsController.name);
  }

  @Post()
  @ApiOperation({
    summary: '予約登録',
    description:
      'オンパクのプログラム実施回に対する予約を登録します。予約IDは一意である必要があります。指定された実施回の定員を超える予約はエラーとなります。',
  })
  @ApiResponse({
    status: 201,
    description: '予約の登録に成功しました。',
  })
  @ApiResponse({
    status: 400,
    description:
      'リクエストデータが不正です。必須項目の未入力や、データ形式が間違っている可能性があります。',
  })
  @ApiResponse({
    status: 401,
    description: 'APIキーが無効か、認証に失敗しました。',
  })
  @ApiResponse({
    status: 404,
    description:
      '指定されたユーザーIDまたはプログラム実施回IDが見つかりません。',
  })
  @ApiResponse({
    status: 409,
    description: '既に同じ予約IDが存在するか、実施回の定員に達しています。',
  })
  async createReservation(
    @Body() createReservationDto: CreateReservationDto,
  ): Promise<void> {
    this.logger.debug(
      `Received request to create reservation: ${createReservationDto.reservation_id}`,
    );
    try {
      await this.reservationsService.createReservation(createReservationDto);
    } catch (error) {
      this.logger.error(
        `Failed to create reservation: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
