import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class CreateExportHttpDto {
  @ApiPropertyOptional({ example: '03' })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  month?: string;

  @ApiPropertyOptional({ example: '2024' })
  @IsOptional()
  @IsString()
  @Length(4, 4)
  year?: string;

  @ApiPropertyOptional({ example: 'PENDING' })
  @IsOptional()
  @IsString()
  status?: string;
}
