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

@ApiTags('Programs')
@ApiBearerAuth()
@Controller('api/v1/onpaku/program')
@UseGuards(ApiKeyGuard)
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Post()
  @ApiOperation({ summary: 'プログラム登録・更新' })
  @ApiResponse({ status: 201, description: 'プログラムの登録・更新に成功' })
  @ApiResponse({ status: 400, description: 'リクエストデータが不正' })
  @ApiResponse({ status: 401, description: '認証エラー' })
  async createOrUpdateProgram(
    @Body() createProgramDto: CreateProgramDto,
  ): Promise<void> {
    await this.programsService.createOrUpdateProgram(createProgramDto);
  }
}
