import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { LocationsService } from './locations.service';

describe('LocationsService', () => {
    let service: LocationsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                HttpModule,
                ConfigModule.forRoot({
                    isGlobal: true,
                }),
            ],
            providers: [LocationsService],
        }).compile();

        service = module.get<LocationsService>(LocationsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // Note: These tests require a valid GOONG_API_KEY in environment
    // Uncomment to run integration tests

    // it('should search for places', async () => {
    //   const result = await service.searchPlaces({
    //     input: 'Đà Lạt',
    //     limit: 5,
    //   });
    //   expect(result.success).toBe(true);
    //   expect(result.data.predictions).toBeDefined();
    // });

    // it('should get place detail', async () => {
    //   const result = await service.getPlaceDetail({
    //     place_id: 'ChIJBwVIBKcpdTERLEfQnwfzOjA',
    //   });
    //   expect(result.success).toBe(true);
    //   expect(result.data.result).toBeDefined();
    // });
});
