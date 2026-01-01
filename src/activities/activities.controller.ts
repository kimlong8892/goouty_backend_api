import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ActivityResponseDto } from './dto/activity-response.dto';

@ApiTags('activities')
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new activity' })
  @ApiResponse({ status: 201, description: 'Activity created successfully', type: ActivityResponseDto })
  create(@Body() createActivityDto: CreateActivityDto) {
    return this.activitiesService.create(createActivityDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all activities for a day' })
  @ApiResponse({ status: 200, description: 'Return all activities', type: [ActivityResponseDto] })
  @ApiQuery({ name: 'dayId', required: true, description: 'Day ID' })
  findAll(@Query('dayId') dayId: string) {
    return this.activitiesService.findAll(dayId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an activity by ID' })
  @ApiResponse({ status: 200, description: 'Return the activity', type: ActivityResponseDto })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  @ApiParam({ name: 'id', description: 'Activity ID' })
  findOne(@Param('id') id: string) {
    return this.activitiesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an activity' })
  @ApiResponse({ status: 200, description: 'Activity updated successfully', type: ActivityResponseDto })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  @ApiParam({ name: 'id', description: 'Activity ID' })
  update(@Param('id') id: string, @Body() updateActivityDto: UpdateActivityDto) {
    return this.activitiesService.update(id, updateActivityDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an activity' })
  @ApiResponse({ status: 200, description: 'Activity deleted successfully', type: ActivityResponseDto })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  @ApiParam({ name: 'id', description: 'Activity ID' })
  remove(@Param('id') id: string) {
    return this.activitiesService.remove(id);
  }

}
