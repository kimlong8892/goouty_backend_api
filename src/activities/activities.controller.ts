import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { ReorderActivitiesDto } from './dto/reorder-activities.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ActivityResponseDto } from './dto/activity-response.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('activities')
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new activity' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiResponse({ status: 201, description: 'Activity created successfully', type: ActivityResponseDto })
  create(
    @Body() createActivityDto: CreateActivityDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      // If file is present, we'll handle it in the service
      // But we can't easily assign it to DTO here if DTO expects string
      // The service will handle the upload and update the DTO/entity
      return this.activitiesService.create(createActivityDto, file);
    }
    return this.activitiesService.create(createActivityDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all activities for a day' })
  @ApiResponse({ status: 200, description: 'Return all activities', type: [ActivityResponseDto] })
  @ApiQuery({ name: 'dayId', required: true, description: 'Day ID' })
  findAll(@Query('dayId') dayId: string) {
    return this.activitiesService.findAll(dayId);
  }

  @Post('reorder')
  @ApiOperation({ summary: 'Reorder activities' })
  @ApiResponse({ status: 200, description: 'Activities reordered successfully' })
  reorder(@Body() reorderActivitiesDto: ReorderActivitiesDto) {
    return this.activitiesService.reorder(reorderActivitiesDto);
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
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiResponse({ status: 200, description: 'Activity updated successfully', type: ActivityResponseDto })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  @ApiParam({ name: 'id', description: 'Activity ID' })
  update(
    @Param('id') id: string,
    @Body() updateActivityDto: UpdateActivityDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.activitiesService.update(id, updateActivityDto, file);
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
