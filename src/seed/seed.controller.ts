import { Controller, Post, HttpStatus, HttpCode } from '@nestjs/common';
import { SeedService } from './seed.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Seed')
@Controller('seed')
@Public()
export class SeedController {
    constructor(private readonly seedService: SeedService) { }

    @Post('demo')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Seed demo data (can only be run once)' })
    @ApiResponse({ status: 200, description: 'Demo data seeded successfully.' })
    @ApiResponse({ status: 409, description: 'Demo data has already been seeded.' })
    async seedDemoData() {
        return await this.seedService.seedDemoData();
    }

    @Post('templates')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Seed trip templates (can only be run once)' })
    @ApiResponse({ status: 200, description: 'Trip templates seeded successfully.' })
    @ApiResponse({ status: 409, description: 'Trip templates have already been seeded.' })
    async seedTripTemplates() {
        return await this.seedService.seedTripTemplates();
    }

    @Post('provinces')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Seed provinces' })
    async seedProvinces() {
        return await this.seedService.seedProvinces();
    }

    @Post('reset')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Reset database (DELETE ALL DATA)' })
    @ApiResponse({ status: 200, description: 'Database reset successfully.' })
    async resetDatabase() {
        return await this.seedService.resetDatabase();
    }

    @Post('all')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Reset and seed all data (Provinces, Demo Data, Templates)' })
    @ApiResponse({ status: 200, description: 'Full seed completed successfully.' })
    async seedAll() {
        return await this.seedService.seedAll();
    }
}
