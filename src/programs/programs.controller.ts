import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { ApiKeyGuard } from '../shared/guards/api-key.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CustomLogger } from '../shared/logger/custom.logger';

@ApiTags('Programs')
@ApiBearerAuth('api-key')
@Controller('api/v1/onpaku/programs')
@UseGuards(ApiKeyGuard)
export class ProgramsController {
  constructor(
    private readonly programsService: ProgramsService,
    private readonly logger: CustomLogger,
  ) {
    this.logger.setContext(ProgramsController.name);
  }

  @Post()
  @ApiOperation({
    summary: 'プログラム登録・更新',
    description:
      'オンパクのプログラム情報を登録・更新します。プログラムIDが既に存在する場合は更新、存在しない場合は新規登録となります。パートナーユーザーは最低1名の登録が必要です。',
  })
  @ApiResponse({
    status: 201,
    description: 'プログラムの登録・更新に成功しました。',
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
      '指定されたパートナーユーザーのメールアドレスが登録されていません。',
  })
  async createOrUpdateProgram(
    @Body() createProgramDto: CreateProgramDto,
  ): Promise<void> {
    this.logger.debug(
      `Received request to create/update program: ${createProgramDto.program.id}`,
    );
    try {
      await this.programsService.createOrUpdateProgram(createProgramDto);
    } catch (error) {
      this.logger.error(
        `Failed to create/update program: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
