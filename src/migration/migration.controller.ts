import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MigrationService } from './migration.service';
import { CloneDbDto } from './dto/clone-db.dto';

@ApiTags('Migration')
@Controller('migration')
export class MigrationController {
    constructor(private readonly migrationService: MigrationService) { }

    @Post('clone')
    @ApiOperation({ summary: 'Clone data from source DB' })
    @ApiBody({ type: CloneDbDto })
    async cloneData(@Body() dto: CloneDbDto) {
        return this.migrationService.cloneData(dto);
    }
}
