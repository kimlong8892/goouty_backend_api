import { Body, Controller, Post } from '@nestjs/common';
import { MigrationService } from './migration.service';
import { CloneDbDto } from './dto/clone-db.dto';

@Controller('migration')
export class MigrationController {
    constructor(private readonly migrationService: MigrationService) { }

    @Post('clone')
    async cloneData(@Body() dto: CloneDbDto) {
        return this.migrationService.cloneData(dto);
    }
}
