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
@ApiBearerAuth()
@Controller('api/v1/onpaku/user')
@UseGuards(ApiKeyGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly logger: CustomLogger,
  ) {
    this.logger.setContext(UsersController.name);
  }

  @Post()
  @ApiOperation({ summary: 'ユーザー新規登録' })
  @ApiResponse({ status: 201, description: 'ユーザーの登録に成功' })
  @ApiResponse({ status: 400, description: 'リクエストデータが不正' })
  @ApiResponse({ status: 401, description: '認証エラー' })
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
  @ApiOperation({ summary: 'ユーザー情報更新' })
  @ApiResponse({ status: 200, description: 'ユーザー情報の更新に成功' })
  @ApiResponse({ status: 400, description: 'リクエストデータが不正' })
  @ApiResponse({ status: 401, description: '認証エラー' })
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
