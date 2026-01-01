import { ApiProperty } from '@nestjs/swagger';

export class GenerateShareLinkDto {
  @ApiProperty({ description: 'Generated share token' })
  shareToken: string;

  @ApiProperty({ description: 'Share link URL' })
  shareLink: string;

  @ApiProperty({ description: 'Trip ID' })
  tripId: number;
}
