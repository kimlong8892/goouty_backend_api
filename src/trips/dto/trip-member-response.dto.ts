import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TripMemberResponseDto {
  @ApiProperty({ description: 'Member ID' })
  id: number;

  @ApiPropertyOptional({ description: 'User ID (nullable for pending invitations)' })
  userId: number | null;

  @ApiProperty({ description: 'Trip ID' })
  tripId: number;

  @ApiProperty({ description: 'Invite status', enum: ['pending', 'accepted'] })
  status: string;

  @ApiProperty({ description: 'When user joined the trip' })
  joinedAt: Date;

  @ApiPropertyOptional({ description: 'Invited email (for pending invitations when user not exists)' })
  invitedEmail?: string;

  @ApiProperty({ description: 'User information' })
  user: {
    id: number | null;
    email: string;
    fullName?: string | null;
    profilePicture?: string | null;
  };
}
