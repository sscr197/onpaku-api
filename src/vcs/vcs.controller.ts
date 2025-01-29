import {
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
  Patch,
  Body,
} from '@nestjs/common';
import { VcsService } from './vcs.service';
import { VCDataDto } from './dto/vc-data.dto';
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

  @Patch('activate')
  @ApiOperation({
    summary: 'VCをアクティベート',
    description:
      '指定されたVCをアクティベート（有効化）します。VCのステータスがpendingの場合のみ実行可能です。',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['vcId'],
      properties: {
        vcId: {
          type: 'string',
          description: 'アクティベート対象のVC ID',
          example: 'vc_123456789',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'VCのアクティベートに成功しました。',
  })
  @ApiResponse({
    status: 400,
    description: 'VC IDが指定されていないか、不正なフォーマットです。',
  })
  @ApiResponse({
    status: 401,
    description: 'APIキーが無効か、認証に失敗しました。',
  })
  @ApiResponse({
    status: 404,
    description: '指定されたVC IDのVCが見つかりません。',
  })
  @ApiResponse({
    status: 409,
    description:
      '指定されたVCは既にアクティベートされているか、無効化されています。',
  })
  async activateVC(@Body('vcId') vcId: string): Promise<void> {
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

  @Patch('revoke')
  @ApiOperation({
    summary: 'VCを無効化',
    description:
      '指定されたVCを無効化します。VCのステータスがactiveの場合のみ実行可能です。',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['vcId'],
      properties: {
        vcId: {
          type: 'string',
          description: '無効化対象のVC ID',
          example: 'vc_123456789',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'VCの無効化に成功しました。',
  })
  @ApiResponse({
    status: 400,
    description: 'VC IDが指定されていないか、不正なフォーマットです。',
  })
  @ApiResponse({
    status: 401,
    description: 'APIキーが無効か、認証に失敗しました。',
  })
  @ApiResponse({
    status: 404,
    description: '指定されたVC IDのVCが見つかりません。',
  })
  @ApiResponse({
    status: 409,
    description:
      '指定されたVCは既に無効化されているか、まだアクティベートされていません。',
  })
  async revokeVC(@Body('vcId') vcId: string): Promise<void> {
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
