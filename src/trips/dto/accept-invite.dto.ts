import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class AcceptInviteDto {
  @ApiProperty({ description: 'Invite token gửi qua email' })
  @IsString()
  @Length(64, 128)
  token: string;
}


