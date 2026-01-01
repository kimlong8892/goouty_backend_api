import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DaysService } from './days.service';
import { CreateDayDto } from './dto/create-day.dto';
import { UpdateDayDto } from './dto/update-day.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { DayResponseDto } from './dto/day-response.dto';
import {ActivitiesService} from "../activities/activities.service";

@ApiTags('days')
@Controller('days')
export class DaysController {
  constructor(
      private readonly daysService: DaysService,
      private readonly activitiesService: ActivitiesService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new day' })
  @ApiResponse({ status: 201, description: 'Day created successfully', type: DayResponseDto })
  create(@Body() createDayDto: CreateDayDto) {
    return this.daysService.create(createDayDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a day by ID' })
  @ApiResponse({ status: 200, description: 'Return the day', type: DayResponseDto })
  @ApiResponse({ status: 404, description: 'Day not found' })
  @ApiParam({ name: 'id', description: 'Day ID' })
  findOne(@Param('id') id: string) {
    return this.daysService.findOne(id);
  }

  @Get(':id/activities')
  @ApiOperation({ summary: 'Get all activities for a specific day' })
  @ApiResponse({ status: 200, description: 'Return all activities for a day', type: [DayResponseDto] })
  @ApiResponse({ status: 404, description: 'Day not found' })
  @ApiParam({ name: 'id', description: 'Day ID' })
  async getDays(@Param('id') id: string) {
    await this.daysService.findOne(id);
    return this.activitiesService.findAll(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a day' })
  @ApiResponse({ status: 200, description: 'Day updated successfully', type: DayResponseDto })
  @ApiResponse({ status: 404, description: 'Day not found' })
  @ApiParam({ name: 'id', description: 'Day ID' })
  update(@Param('id') id: string, @Body() updateDayDto: UpdateDayDto) {
    return this.daysService.update(id, updateDayDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a day' })
  @ApiResponse({ status: 200, description: 'Day deleted successfully', type: DayResponseDto })
  @ApiResponse({ status: 404, description: 'Day not found' })
  @ApiParam({ name: 'id', description: 'Day ID' })
  remove(@Param('id') id: string) {
    return this.daysService.remove(id);
  }
}