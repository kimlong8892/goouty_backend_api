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
}
