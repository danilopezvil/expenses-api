import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RefreshHttpDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiJ9...' })
  @IsString()
  @MinLength(1)
  refreshToken!: string;
}
