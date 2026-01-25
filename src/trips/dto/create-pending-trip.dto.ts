import { ApiProperty } from '@nestjs/swagger';
import { IsUrl, IsNotEmpty } from 'class-validator';

export class CreatePendingTripDto {
    @ApiProperty({
        description: 'The URL to create a trip from',
        example: 'https://example.com/some-trip-info',
    })
    @IsUrl()
    @IsNotEmpty()
    url: string;
}
