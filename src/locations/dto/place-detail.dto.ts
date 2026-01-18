import { IsString, IsNotEmpty } from 'class-validator';

export class PlaceDetailDto {
    @IsString()
    @IsNotEmpty()
    place_id: string;
}
