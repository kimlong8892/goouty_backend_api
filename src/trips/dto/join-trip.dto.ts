import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinTripDto {
  @ApiProperty({ description: 'Share token to join trip' })
  @IsString()
  @IsNotEmpty()
  shareToken: string;
}
