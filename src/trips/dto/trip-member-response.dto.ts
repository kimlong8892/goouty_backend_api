import { ApiProperty } from '@nestjs/swagger';

export class TripMemberResponseDto {
  @ApiProperty({ description: 'Member ID' })
  id: number;

  @ApiProperty({ description: 'User ID' })
  userId: number;

  @ApiProperty({ description: 'Trip ID' })
  tripId: number;

  @ApiProperty({ description: 'Invite status', enum: ['pending', 'accepted'] })
  status: string;

  @ApiProperty({ description: 'When user joined the trip' })
  joinedAt: Date;

  @ApiProperty({ description: 'User information' })
  user: {
    id: number;
    email: string;
    fullName?: string;
    profilePicture?: string;
  };
}
