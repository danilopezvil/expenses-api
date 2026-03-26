import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ExpenseSource } from '../../../domain/entities/expense.entity';

export class CreateExpenseHttpDto {
  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440002' })
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiProperty({ example: 'Dinner at Sushi Place' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  description!: string;

  @ApiProperty({ example: 120.5 })
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ enum: ExpenseSource })
  @IsOptional()
  @IsEnum(ExpenseSource)
  source?: ExpenseSource;

  @ApiProperty({ example: '2024-03-15' })
  @IsDateString()
  date!: string;
}
