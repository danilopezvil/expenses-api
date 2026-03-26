import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

// ── Assign ────────────────────────────────────────────────────────────────────

export class AssignmentItemHttpDto {
  @ApiProperty({ example: 'member-uuid' })
  @IsString()
  memberId!: string;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(0.01)
  @Max(100)
  percentage!: number;
}

export class AssignExpenseHttpDto {
  @ApiProperty({ type: [AssignmentItemHttpDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssignmentItemHttpDto)
  assignments!: AssignmentItemHttpDto[];
}

// ── Group ─────────────────────────────────────────────────────────────────────

export class GroupExpensesHttpDto {
  @ApiProperty({ type: [String], example: ['uuid-1', 'uuid-2'] })
  @IsArray()
  @IsUUID('4', { each: true })
  expenseIds!: string[];

  @ApiProperty({ example: 'March groceries (grouped)' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  description!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  accountId?: string;
}

// ── Import ────────────────────────────────────────────────────────────────────

export class PreviewImportHttpDto {
  @ApiProperty({ example: 'group-uuid' })
  @IsUUID()
  groupId!: string;

  @ApiProperty({ example: '15/03 | Supermercado | 85.50\n20/03 | Gasolina | 60.00' })
  @IsString()
  rawText!: string;

  @ApiProperty({ example: 2024 })
  @IsNumber()
  @Min(2000)
  @Max(2100)
  year!: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;
}

export class ConfirmImportHttpDto {
  @ApiProperty({ example: 'group-uuid' })
  @IsUUID()
  groupId!: string;

  @ApiProperty({ example: '15/03 | Supermercado | 85.50\n20/03 | Gasolina | 60.00' })
  @IsString()
  rawText!: string;

  @ApiProperty({ example: 2024 })
  @IsNumber()
  @Min(2000)
  @Max(2100)
  year!: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  skipDuplicates?: boolean;
}
