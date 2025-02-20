import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn } from 'class-validator';
import { VCStatus } from './vc-data.dto';

export class UpdateVcStatusDto {
  @ApiProperty({
    description: 'VCのドキュメントID',
    example: 'vc_12345',
    required: true,
  })
  @IsString()
  documentId: string;

  @ApiProperty({
    description: 'VCの新しいステータス',
    enum: VCStatus,
    example: VCStatus.Completed,
    required: true,
  })
  @IsString()
  @IsIn([
    VCStatus.Pending,
    VCStatus.Completed,
    VCStatus.Failed,
    VCStatus.InProgress,
  ])
  status: VCStatus;
}
