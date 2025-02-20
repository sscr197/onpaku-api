import {
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
  Patch,
  Body,
  HttpCode,
} from '@nestjs/common';
import { VcsService } from './vcs.service';
import { VCDataDto } from './dto/vc-data.dto';
import { UpdateVcStatusDto } from './dto/update-vc-status.dto';
import { ApiKeyGuard } from '../shared/guards/api-key.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { CustomLogger } from '../shared/logger/custom.logger';

@ApiTags('VCs')
@ApiBearerAuth('api-key')
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
  @ApiOperation({
    summary: 'メールアドレスに紐づくPending状態のVC一覧を取得',
    description:
      '指定されたメールアドレスに関連する、まだアクティベートされていないVC（Verifiable Credential）の一覧を取得します。',
  })
  @ApiQuery({
    name: 'email',
    description: '検索対象のメールアドレス',
    required: true,
    type: String,
    example: 'test@example.com',
  })
  @ApiResponse({
    status: 200,
    description:
      'Pending状態のVC一覧を返却します。該当するVCが存在しない場合は空配列を返します。',
    type: [VCDataDto],
  })
  @ApiResponse({
    status: 400,
    description: 'メールアドレスが指定されていないか、不正なフォーマットです。',
  })
  @ApiResponse({
    status: 401,
    description: 'APIキーが無効か、認証に失敗しました。',
  })
  async getPendingVCs(@Query('email') email: string): Promise<any[]> {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    this.logger.debug(
      `Received request to get pending VCs for email: ${email}`,
    );
    try {
      return await this.vcsService.getPendingVCsByEmailTransformed(email);
    } catch (error) {
      this.logger.error(
        `Failed to get pending VCs: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Patch('status')
  @HttpCode(200)
  @ApiOperation({
    summary: 'VCのステータスを更新',
    description: '指定されたVCのステータスを更新します。',
  })
  @ApiBody({
    type: UpdateVcStatusDto,
    description: 'VCのドキュメントIDと新しいステータスを指定します。',
  })
  @ApiResponse({
    status: 200,
    description: 'VCのステータス更新に成功しました。',
  })
  @ApiResponse({
    status: 400,
    description: 'documentIdまたはstatusが不正です。',
  })
  @ApiResponse({
    status: 401,
    description: 'APIキーが無効か、認証に失敗しました。',
  })
  @ApiResponse({
    status: 404,
    description: '指定されたVCが見つかりません。',
  })
  async updateVcStatus(
    @Body() { documentId, status }: UpdateVcStatusDto,
  ): Promise<void> {
    if (!documentId) {
      throw new BadRequestException('documentId is required');
    }
    this.logger.debug(
      `Received request to update VC status: ${documentId} -> ${status}`,
    );
    try {
      await this.vcsService.updateVcStatus(documentId, status);
    } catch (error) {
      this.logger.error(
        `Failed to update VC status: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
