import {
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
  Patch,
  Param,
} from '@nestjs/common';
import { VcsService } from './vcs.service';
import { VCDataDto } from './dto/vc-data.dto';
import { ApiKeyGuard } from '../shared/guards/api-key.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CustomLogger } from '../shared/logger/custom.logger';

@ApiTags('VCs')
@ApiBearerAuth()
@Controller('api/v1/onpaku/vcs')
@UseGuards(ApiKeyGuard)
export class VcsController {
  constructor(
    private readonly vcsService: VcsService,
    private readonly logger: CustomLogger,
  ) {
    this.logger.setContext(VcsController.name);
  }

  @Get('pending')
  @ApiOperation({ summary: 'メールアドレスに紐づくPending状態のVC一覧を取得' })
  @ApiResponse({
    status: 200,
    description: 'Pending状態のVC一覧を返却',
    type: [VCDataDto],
  })
  @ApiResponse({ status: 400, description: 'メールアドレスが指定されていない' })
  @ApiResponse({ status: 401, description: '認証エラー' })
  async getPendingVCs(@Query('email') email: string): Promise<VCDataDto[]> {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    this.logger.debug(
      `Received request to get pending VCs for email: ${email}`,
    );
    try {
      return await this.vcsService.getPendingVCsByEmail(email);
    } catch (error) {
      this.logger.error(
        `Failed to get pending VCs: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Patch(':vcId/activate')
  @ApiOperation({ summary: 'VCをアクティベート' })
  @ApiResponse({ status: 200, description: 'VCのアクティベートに成功' })
  @ApiResponse({ status: 400, description: 'VC IDが指定されていない' })
  @ApiResponse({ status: 401, description: '認証エラー' })
  async activateVC(@Param('vcId') vcId: string): Promise<void> {
    if (!vcId) {
      throw new BadRequestException('VC ID is required');
    }
    this.logger.debug(`Received request to activate VC: ${vcId}`);
    try {
      await this.vcsService.activateVC(vcId);
    } catch (error) {
      this.logger.error(`Failed to activate VC: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Patch(':vcId/revoke')
  @ApiOperation({ summary: 'VCを無効化' })
  @ApiResponse({ status: 200, description: 'VCの無効化に成功' })
  @ApiResponse({ status: 400, description: 'VC IDが指定されていない' })
  @ApiResponse({ status: 401, description: '認証エラー' })
  async revokeVC(@Param('vcId') vcId: string): Promise<void> {
    if (!vcId) {
      throw new BadRequestException('VC ID is required');
    }
    this.logger.debug(`Received request to revoke VC: ${vcId}`);
    try {
      await this.vcsService.revokeVC(vcId);
    } catch (error) {
      this.logger.error(`Failed to revoke VC: ${error.message}`, error.stack);
      throw error;
    }
  }
}
