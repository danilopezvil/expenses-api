import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExpenseCategoryEnum } from '../../../domain/value-objects/expense-category.vo';

export class ExpenseSplitResponseDto {
  @ApiProperty() userId!: string;
  @ApiProperty() amount!: number;
  @ApiProperty() currency!: string;
  @ApiProperty() settled!: boolean;
}

export class ExpenseResponseHttpDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() amount!: number;
  @ApiProperty() currency!: string;
  @ApiProperty({ enum: ExpenseCategoryEnum }) category!: ExpenseCategoryEnum;
  @ApiProperty() paidById!: string;
  @ApiPropertyOptional() groupId?: string;
  @ApiProperty({ type: [ExpenseSplitResponseDto] }) splits!: ExpenseSplitResponseDto[];
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class PaginatedExpenseResponseDto {
  @ApiProperty({ type: [ExpenseResponseHttpDto] }) items!: ExpenseResponseHttpDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
}
