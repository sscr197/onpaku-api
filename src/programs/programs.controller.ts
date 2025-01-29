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
@ApiBearerAuth()
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
  @ApiOperation({ summary: 'プログラム登録・更新' })
  @ApiResponse({ status: 201, description: 'プログラムの登録・更新に成功' })
  @ApiResponse({ status: 400, description: 'リクエストデータが不正' })
  @ApiResponse({ status: 401, description: '認証エラー' })
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
