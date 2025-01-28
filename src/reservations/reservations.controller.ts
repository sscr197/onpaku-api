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

@ApiTags('Reservations')
@ApiBearerAuth()
@Controller('api/v1/onpaku/reservation')
@UseGuards(ApiKeyGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @ApiOperation({ summary: '予約登録' })
  @ApiResponse({ status: 201, description: '予約の登録に成功' })
  @ApiResponse({ status: 400, description: 'リクエストデータが不正' })
  @ApiResponse({ status: 401, description: '認証エラー' })
  @ApiResponse({ status: 404, description: 'ユーザーが見つかりません' })
  async createReservation(
    @Body() createReservationDto: CreateReservationDto,
  ): Promise<void> {
    await this.reservationsService.createReservation(createReservationDto);
  }
}
