import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';

export class CreatePaymentHttpDto {
  @ApiProperty({ example: 'member-uuid' })
  @IsUUID()
  memberId!: string;

  @ApiProperty({ example: '03' })
  @IsString()
  @Length(2, 2)
  month!: string;

  @ApiProperty({ example: '2024' })
  @IsString()
  @Length(4, 4)
  year!: string;

  @ApiProperty({ example: 150.0 })
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiPropertyOptional({ example: 'March contribution' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
