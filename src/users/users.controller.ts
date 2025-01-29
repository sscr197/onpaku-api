import { Controller, Post, Patch, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiKeyGuard } from '../shared/guards/api-key.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CustomLogger } from '../shared/logger/custom.logger';

@ApiTags('Users')
@ApiBearerAuth('api-key')
@Controller('api/v1/onpaku/users')
@UseGuards(ApiKeyGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly logger: CustomLogger,
  ) {
    this.logger.setContext(UsersController.name);
  }

  @Post()
  @ApiOperation({
    summary: 'ユーザー新規登録',
    description:
      'オンパクのユーザー情報を新規登録します。既に存在するメールアドレスの場合はエラーとなります。',
  })
  @ApiResponse({
    status: 201,
    description: 'ユーザーの登録に成功しました。',
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
    status: 409,
    description: '既に同じメールアドレスのユーザーが存在します。',
  })
  async createUser(@Body() createUserDto: CreateUserDto): Promise<void> {
    this.logger.debug(
      `Received request to create user: ${createUserDto.email}`,
    );
    try {
      await this.usersService.createUser(createUserDto);
    } catch (error) {
      this.logger.error(`Failed to create user: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Patch()
  @ApiOperation({
    summary: 'ユーザー情報更新',
    description:
      '既存のユーザー情報を更新します。IDとメールアドレスは必須で、その他のフィールドは任意です。',
  })
  @ApiResponse({
    status: 200,
    description: 'ユーザー情報の更新に成功しました。',
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
    description: '指定されたIDのユーザーが見つかりません。',
  })
  async updateUser(@Body() updateUserDto: UpdateUserDto): Promise<void> {
    this.logger.debug(
      `Received request to update user: ${updateUserDto.email}`,
    );
    try {
      await this.usersService.updateUser(updateUserDto);
    } catch (error) {
      this.logger.error(`Failed to update user: ${error.message}`, error.stack);
      throw error;
    }
  }
}
