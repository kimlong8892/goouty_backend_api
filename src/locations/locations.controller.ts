import {
    Controller,
    Get,
    Query,
    HttpStatus,
    HttpCode,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { SearchLocationDto } from './dto/search-location.dto';
import { PlaceDetailDto } from './dto/place-detail.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Locations')
@ApiBearerAuth()
@Controller('locations')
@UseGuards(JwtAuthGuard)
export class LocationsController {
    constructor(private readonly locationsService: LocationsService) { }

    /**
     * Search for places using autocomplete
     * Example: GET /locations/search?input=Đà Lạt&limit=5
     */
    @Get('search')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Search for places using autocomplete',
        description: 'Search for places like Đà Lạt, Phú Quốc, etc. Suitable for destination selection.'
    })
    @ApiQuery({ name: 'input', required: true, description: 'Search query', example: 'Đà Lạt' })
    @ApiQuery({ name: 'limit', required: false, description: 'Number of results (max 20)', example: 5 })
    @ApiQuery({ name: 'location', required: false, description: 'Proximity search (lat,lng)', example: '10.762622,106.660172' })
    @ApiQuery({ name: 'radius', required: false, description: 'Search radius in meters', example: '5000' })
    @ApiQuery({ name: 'more_compound', required: false, description: 'Return more detailed information', example: 'true' })
    async searchPlaces(@Query() query: SearchLocationDto) {
        return this.locationsService.searchPlaces(query);
    }

    /**
     * Get detailed information about a specific place
     * Example: GET /locations/detail?place_id=ChIJBwVIBKcpdTERLEfQnwfzOjA
     */
    @Get('detail')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get place details',
        description: 'Get detailed information about a place using place_id from search results'
    })
    @ApiQuery({ name: 'place_id', required: true, description: 'Place ID from search results', example: 'ChIJBwVIBKcpdTERLEfQnwfzOjA' })
    async getPlaceDetail(@Query() query: PlaceDetailDto) {
        return this.locationsService.getPlaceDetail(query);
    }

    /**
     * Search for popular tourist destinations
     * Example: GET /locations/destinations?query=Phú Quốc&limit=10
     */
    @Get('destinations')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Search tourist destinations',
        description: 'Simplified endpoint for searching popular tourist destinations in Vietnam'
    })
    @ApiQuery({ name: 'query', required: true, description: 'Destination name', example: 'Phú Quốc' })
    @ApiQuery({ name: 'limit', required: false, description: 'Number of results', example: 10 })
    async searchDestinations(
        @Query('query') query: string,
        @Query('limit') limit?: number,
    ) {
        return this.locationsService.searchDestinations(query, limit);
    }
}
