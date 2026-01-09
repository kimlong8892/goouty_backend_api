import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TripTemplatesService } from './trip-templates.service';
import { CreateTripTemplateDto } from './dto/create-trip-template.dto';
import { UpdateTripTemplateDto } from './dto/update-trip-template.dto';
import { GetTripTemplatesQueryDto } from './dto/get-trip-templates-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Trip Templates')
@ApiBearerAuth()
@Controller('trip-templates')
export class TripTemplatesController {
  constructor(private readonly tripTemplatesService: TripTemplatesService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new trip template' })
  @ApiResponse({ status: 201, description: 'Trip template created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() createTripTemplateDto: CreateTripTemplateDto) {
    return this.tripTemplatesService.create(createTripTemplateDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user\'s trip templates' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 10 })
  @ApiResponse({ status: 200, description: 'Trip templates retrieved successfully' })
  findAll(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.tripTemplatesService.findAll({ search, page, limit });
  }

  @Get('public')
  @ApiOperation({ summary: 'Get public trip templates' })
  @ApiResponse({ status: 200, description: 'Public trip templates retrieved successfully' })
  findPublicTemplates(@Query() query: GetTripTemplatesQueryDto) {
    return this.tripTemplatesService.findPublicTemplates(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a trip template by ID' })
  @ApiResponse({ status: 200, description: 'Trip template retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Trip template not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  findOne(@Param('id') id: string) {
    return this.tripTemplatesService.findOneForUser(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a trip template' })
  @ApiResponse({ status: 200, description: 'Trip template updated successfully' })
  @ApiResponse({ status: 404, description: 'Trip template not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  update(
    @Param('id') id: string,
    @Body() updateTripTemplateDto: UpdateTripTemplateDto,
  ) {
    return this.tripTemplatesService.update(id, updateTripTemplateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a trip template' })
  @ApiResponse({ status: 204, description: 'Trip template deleted successfully' })
  @ApiResponse({ status: 404, description: 'Trip template not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  remove(@Param('id') id: string) {
    return this.tripTemplatesService.remove(id);
  }

  @Post(':id/duplicate')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Duplicate a trip template' })
  @ApiResponse({ status: 201, description: 'Trip template duplicated successfully' })
  @ApiResponse({ status: 404, description: 'Trip template not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  duplicate(
    @Param('id') id: string,
    @Body() body?: { title?: string },
  ) {
    return this.tripTemplatesService.duplicateTemplate(id, body?.title);
  }

  @Post(':id/create-trip')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get template data for creating a trip' })
  @ApiResponse({ status: 200, description: 'Template data for trip creation retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Trip template not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  createTripFromTemplate(
    @Param('id') id: string,
    @Body() body?: { title?: string },
  ) {
    return this.tripTemplatesService.createTripFromTemplate(id, body?.title);
  }
}
