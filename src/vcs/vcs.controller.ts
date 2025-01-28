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

@ApiTags('VCs')
@ApiBearerAuth()
@Controller('api/v1/onpaku/vcs')
@UseGuards(ApiKeyGuard)
export class VcsController {
  constructor(private readonly vcsService: VcsService) {}

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

    return this.vcsService.getPendingVCsByEmail(email);
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
    await this.vcsService.activateVC(vcId);
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
    await this.vcsService.revokeVC(vcId);
  }
}
