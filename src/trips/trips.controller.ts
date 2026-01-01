import {Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, Put, UseInterceptors, UploadedFile} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import {ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiConsumes, ApiBody} from '@nestjs/swagger';
import { TripResponseDto } from './dto/trip-response.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { TripMemberResponseDto } from './dto/trip-member-response.dto';
import { GenerateShareLinkDto } from './dto/generate-share-link.dto';
import { JoinTripDto } from './dto/join-trip.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { UploadTripAvatarDto, UploadTripAvatarResponseDto } from './dto/upload-trip-avatar.dto';
import {DaysService} from "../days/days.service";
import {DayResponseDto} from "../days/dto/day-response.dto";
import {JwtAuthGuard} from "../auth/guards/jwt-auth.guard";

@ApiTags('trips')
@Controller('trips')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TripsController {
  constructor(
    private readonly tripsService: TripsService,
    private readonly daysService: DaysService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new trip' })
  @ApiResponse({ status: 201, description: 'Trip created successfully', type: TripResponseDto })
  create(@Body() createTripDto: CreateTripDto, @Request() req: any) {
    return this.tripsService.create(createTripDto, req.user.userId);
  }

  @Post('create-from-template/:templateId')
  @ApiOperation({ summary: 'Create a new trip from a template' })
  @ApiResponse({ status: 201, description: 'Trip created successfully from template', type: TripResponseDto })
  @ApiParam({ name: 'templateId', description: 'Template ID to create trip from' })
  createFromTemplate(
    @Param('templateId') templateId: string,
    @Body() body: { title?: string },
    @Request() req: any
  ) {
    return this.tripsService.createTripFromTemplate(templateId, req.user.userId, body?.title);
  }

  @Get()
  @ApiOperation({ summary: 'Get all trips for authenticated user with search and pagination' })
  @ApiResponse({ status: 200, description: 'Return all trips for authenticated user', type: [TripResponseDto] })
  findAll(
    @Request() req: any,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.tripsService.findAll(req.user.userId, {
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10
    });
  }

  @Get(':id/days')
  @ApiOperation({ summary: 'Get all days for a specific trip' })
  @ApiResponse({ status: 200, description: 'Return all days for a trip', type: [DayResponseDto] })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  @ApiParam({ name: 'id', description: 'Trip ID' })
  async getDays(@Param('id') id: string) {
    return this.daysService.findAll(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a trip by ID' })
  @ApiResponse({ status: 200, description: 'Return the trip', type: TripResponseDto })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  @ApiParam({ name: 'id', description: 'Trip ID' })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.tripsService.findOneForUser(id, req.user.userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a trip' })
  @ApiResponse({ status: 200, description: 'Trip updated successfully', type: TripResponseDto })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  @ApiResponse({ status: 403, description: 'Only trip owner can update trip' })
  @ApiParam({ name: 'id', description: 'Trip ID' })
  update(@Param('id') id: string, @Body() updateTripDto: UpdateTripDto, @Request() req: any) {
    return this.tripsService.update(id, updateTripDto, req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a trip' })
  @ApiResponse({ status: 200, description: 'Trip deleted successfully' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  @ApiResponse({ status: 403, description: 'Only trip owner can delete trip' })
  @ApiParam({ name: 'id', description: 'Trip ID' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.tripsService.remove(id, req.user.userId);
  }

  // ===== TRIP MEMBERS ENDPOINTS =====

  @Get(':id/members')
  @ApiOperation({ summary: 'Get all members of a trip' })
  @ApiResponse({ status: 200, description: 'Return all trip members', type: [TripMemberResponseDto] })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  @ApiParam({ name: 'id', description: 'Trip ID' })
  getTripMembers(@Param('id') id: string) {
    return this.tripsService.getTripMembers(id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add a member to trip' })
  @ApiResponse({ status: 201, description: 'Member added successfully', type: TripMemberResponseDto })
  @ApiResponse({ status: 404, description: 'Trip or user not found' })
  @ApiResponse({ status: 403, description: 'Only trip owner can add members' })
  @ApiResponse({ status: 409, description: 'User is already a member' })
  @ApiParam({ name: 'id', description: 'Trip ID' })
  addMemberToTrip(
    @Param('id') id: string,
    @Body() addMemberDto: AddMemberDto,
    @Request() req: any,
  ) {
    return this.tripsService.addMemberToTrip(id, addMemberDto, req.user.userId);
  }

  @Delete(':id/members/:memberId')
  @ApiOperation({ summary: 'Remove a member from trip' })
  @ApiResponse({ status: 200, description: 'Member removed successfully' })
  @ApiResponse({ status: 404, description: 'Trip or member not found' })
  @ApiResponse({ status: 403, description: 'Only trip owner can remove members' })
  @ApiParam({ name: 'id', description: 'Trip ID' })
  @ApiParam({ name: 'memberId', description: 'Member ID' })
  removeMemberFromTrip(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Request() req: any,
  ) {
    return this.tripsService.removeMemberFromTrip(id, memberId, req.user.userId);
  }

  // ===== SHARE LINK ENDPOINTS =====

  @Post(':id/share')
  @ApiOperation({ summary: 'Generate share link for trip' })
  @ApiResponse({ status: 201, description: 'Share link generated successfully', type: GenerateShareLinkDto })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  @ApiResponse({ status: 403, description: 'Only trip owner can generate share links' })
  @ApiParam({ name: 'id', description: 'Trip ID' })
  generateShareLink(@Param('id') id: string, @Request() req: any) {
    return this.tripsService.generateShareLink(id, req.user.userId);
  }

  @Post('join')
  @ApiOperation({ summary: 'Join trip using share token' })
  @ApiResponse({ status: 201, description: 'Successfully joined trip', type: TripMemberResponseDto })
  @ApiResponse({ status: 404, description: 'Invalid or expired share link' })
  @ApiResponse({ status: 409, description: 'Already a member of this trip' })
  joinTripByToken(@Body() joinTripDto: JoinTripDto, @Request() req: any) {
    return this.tripsService.joinTripByToken(joinTripDto, req.user.userId);
  }

  @Post('invites/accept')
  @ApiOperation({ summary: 'Accept trip invitation by token' })
  @ApiResponse({ status: 201, description: 'Invitation accepted', type: TripMemberResponseDto })
  @ApiResponse({ status: 404, description: 'Invalid or expired invite' })
  acceptInvite(@Body() dto: AcceptInviteDto, @Request() req: any) {
    return this.tripsService.acceptInvite(dto, req.user.userId);
  }

  @Delete(':id/share')
  @ApiOperation({ summary: 'Revoke share link for trip' })
  @ApiResponse({ status: 200, description: 'Share link revoked successfully' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  @ApiResponse({ status: 403, description: 'Only trip owner can revoke share links' })
  @ApiParam({ name: 'id', description: 'Trip ID' })
  revokeShareLink(@Param('id') id: string, @Request() req: any) {
    return this.tripsService.revokeShareLink(id, req.user.userId);
  }

  // ===== TRIP AVATAR ENDPOINTS =====

  @Post(':id/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({ summary: 'Upload trip avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'Trip ID' })
  @ApiBody({
    description: 'Trip avatar image file',
    type: UploadTripAvatarDto,
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
          description: 'Trip avatar image file (max 5MB)',
        },
      },
      required: ['avatar'],
    },
  })
  @ApiResponse({ status: 201, description: 'Trip avatar uploaded successfully', type: UploadTripAvatarResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file or file too large' })
  @ApiResponse({ status: 403, description: 'Only trip owner can upload avatar' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  uploadTripAvatar(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    return this.tripsService.uploadTripAvatar(id, file, req.user.userId);
  }

  @Delete(':id/avatar')
  @ApiOperation({ summary: 'Delete trip avatar' })
  @ApiParam({ name: 'id', description: 'Trip ID' })
  @ApiResponse({ status: 200, description: 'Trip avatar deleted successfully' })
  @ApiResponse({ status: 400, description: 'Trip has no avatar to delete' })
  @ApiResponse({ status: 403, description: 'Only trip owner can delete avatar' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  deleteTripAvatar(@Param('id') id: string, @Request() req: any) {
    return this.tripsService.deleteTripAvatar(id, req.user.userId);
  }
}
