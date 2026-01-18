import { Controller, Post, Body, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { GetRatingsQueryDto } from './dto/get-ratings-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Ratings')
@Controller('ratings')
export class RatingsController {
    constructor(private readonly ratingsService: RatingsService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new rating' })
    create(@Req() req, @Body() createRatingDto: CreateRatingDto) {
        return this.ratingsService.create(req.user.userId, createRatingDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get list of ratings' })
    findAll(@Query() query: GetRatingsQueryDto) {
        return this.ratingsService.findAll(query);
    }

    @Get('check')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Check if current user has rated' })
    checkUserRating(@Req() req) {
        return this.ratingsService.checkUserRating(req.user.userId);
    }
}
