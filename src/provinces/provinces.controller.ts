import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ProvincesService } from './provinces.service';
import { GetProvincesQueryDto } from './dto/get-provinces-query.dto';

@Controller('provinces')
export class ProvincesController {
  constructor(private readonly provincesService: ProvincesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAllProvinces(@Query() query: any) {
    // Convert query parameters to our DTO format
    const dto: GetProvincesQueryDto = {
      search: query.search,
      divisionType: query.divisionType,
    };
    return this.provincesService.findAllProvinces(dto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findProvinceById(@Param('id') id: string) {
    return this.provincesService.findProvinceById(id);
  }

  @Get('code/:code')
  @HttpCode(HttpStatus.OK)
  async findProvinceByCode(@Param('code', ParseIntPipe) code: number) {
    return this.provincesService.findProvinceByCode(code);
  }
}
