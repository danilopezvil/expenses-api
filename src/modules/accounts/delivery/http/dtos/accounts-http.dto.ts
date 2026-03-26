import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Length, MaxLength, MinLength } from 'class-validator';
import { AccountType } from '@prisma/client';

export class CreateAccountHttpDto {
  @ApiProperty({ example: 'Tarjeta Principal' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  holder?: string;

  @ApiPropertyOptional({ enum: AccountType, default: 'CREDIT_CARD' })
  @IsOptional()
  @IsEnum(AccountType)
  type?: AccountType;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;
}

export class UpdateAccountHttpDto {
  @ApiPropertyOptional({ example: 'Tarjeta Principal' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  holder?: string;

  @ApiPropertyOptional({ example: 'EUR' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;
}
