import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ExpenseCategoryEnum } from '../../../domain/value-objects/expense-category.vo';

export class CreateExpenseHttpDto {
  @ApiProperty({ example: 'Dinner at Sushi Place' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: 'Team dinner after sprint review' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: 120.5 })
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiProperty({ example: 'USD' })
  @IsString()
  @MinLength(3)
  @MaxLength(3)
  currency!: string;

  @ApiPropertyOptional({ enum: ExpenseCategoryEnum, example: ExpenseCategoryEnum.FOOD })
  @IsOptional()
  @IsEnum(ExpenseCategoryEnum)
  category?: ExpenseCategoryEnum;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  paidById?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsOptional()
  @IsUUID()
  groupId?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  splitBetween?: string[];
}
