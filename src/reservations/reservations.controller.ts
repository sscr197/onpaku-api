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
@ApiBearerAuth()
@Controller('api/v1/onpaku/reservation')
@UseGuards(ApiKeyGuard)
export class ReservationsController {
  constructor(
    private readonly reservationsService: ReservationsService,
    private readonly logger: CustomLogger,
  ) {
    this.logger.setContext(ReservationsController.name);
  }

  @Post()
  @ApiOperation({ summary: '予約登録' })
  @ApiResponse({ status: 201, description: '予約の登録に成功' })
  @ApiResponse({ status: 400, description: 'リクエストデータが不正' })
  @ApiResponse({ status: 401, description: '認証エラー' })
  @ApiResponse({ status: 404, description: 'ユーザーが見つかりません' })
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
