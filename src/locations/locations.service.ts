import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { SearchLocationDto } from './dto/search-location.dto';
import { PlaceDetailDto } from './dto/place-detail.dto';
import {
    GoongAutocompleteResponse,
    GoongPlaceDetailResponse,
    LocationApiResponse,
} from './interfaces/goong-api.interface';


@Injectable()
export class LocationsService {
    private readonly logger = new Logger(LocationsService.name);
    private readonly goongApiKey: string;
    private readonly goongBaseUrl = 'https://rsapi.goong.io';

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        this.goongApiKey = this.configService.get<string>('GOONG_API_KEY');
        if (!this.goongApiKey) {
            this.logger.warn('GOONG_API_KEY is not configured');
        }
    }

    /**
     * Search for places using Goong Place Autocomplete API
     * Suitable for searching destinations like "Đà Lạt", "Phú Quốc", etc.
     */
    async searchPlaces(
        dto: SearchLocationDto,
    ): Promise<LocationApiResponse<GoongAutocompleteResponse>> {
        try {
            const params: any = {
                api_key: this.goongApiKey,
                input: dto.input,
            };

            if (dto.location) {
                params.location = dto.location;
            }

            if (dto.limit) {
                params.limit = dto.limit;
            }

            if (dto.radius) {
                params.radius = dto.radius;
            }

            if (dto.more_compound) {
                params.more_compound = dto.more_compound;
            }

            const url = `${this.goongBaseUrl}/Place/AutoComplete`;

            this.logger.debug(`Calling Goong API: ${url}`);

            const response = await firstValueFrom(
                this.httpService.get(url, { params }),
            );

            return {
                success: true,
                data: response.data,
            };
        } catch (error) {
            this.logger.error('Error calling Goong Place Autocomplete API', error);
            throw new HttpException(
                {
                    success: false,
                    message: 'Failed to search places',
                    error: error.response?.data || error.message,
                },
                error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /**
     * Get detailed information about a place using place_id
     */
    async getPlaceDetail(
        dto: PlaceDetailDto,
    ): Promise<LocationApiResponse<GoongPlaceDetailResponse>> {
        try {
            const params = {
                api_key: this.goongApiKey,
                place_id: dto.place_id,
            };

            const url = `${this.goongBaseUrl}/Place/Detail`;

            this.logger.debug(`Calling Goong Place Detail API: ${url}`);

            const response = await firstValueFrom(
                this.httpService.get(url, { params }),
            );

            return {
                success: true,
                data: response.data,
            };
        } catch (error) {
            this.logger.error('Error calling Goong Place Detail API', error);
            throw new HttpException(
                {
                    success: false,
                    message: 'Failed to get place details',
                    error: error.response?.data || error.message,
                },
                error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /**
     * Search for popular destinations in Vietnam
     * This is a helper method that searches for tourist destinations
     */
    async searchDestinations(query: string, limit: number = 10) {
        return this.searchPlaces({
            input: query,
            limit,
            more_compound: 'true',
        });
    }
}
