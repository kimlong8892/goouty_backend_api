import {
    Controller,
    Post,
    Get,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    UseGuards,
    Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('AI')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Post('process-bill')
    @UseInterceptors(FileInterceptor('image'))
    @ApiOperation({ summary: 'Process bill image using Gemini AI to get total amount (Limited to 5 times/day)' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'Bill image to process',
        schema: {
            type: 'object',
            properties: {
                image: {
                    type: 'string',
                    format: 'binary',
                    description: 'Image of the bill/receipt',
                },
            },
            required: ['image'],
        },
    })
    @ApiResponse({ status: 201, description: 'Bill processed successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 403, description: 'Usage limit exceeded' })
    async processBill(@UploadedFile() file: Express.Multer.File, @Request() req: any) {
        if (!file) {
            throw new BadRequestException('No image file provided');
        }

        if (!file.mimetype.startsWith('image/')) {
            throw new BadRequestException('File must be an image');
        }

        try {
            const result = await this.aiService.processBillImage(req.user.userId, file);
            return {
                success: true,
                data: result,
            };
        } catch (error) {
            if (error.status === 403) throw error;
            throw new BadRequestException(`Failed to process bill: ${error.message}`);
        }
    }

    @Get('usage')
    @ApiOperation({ summary: 'Get current AI bill scan usage for authenticated user' })
    @ApiResponse({ status: 200, description: 'Return usage info' })
    async getUsage(@Request() req: any) {
        try {
            const result = await this.aiService.getUsageInfo(req.user.userId);
            return {
                success: true,
                data: result,
            };
        } catch (error) {
            throw new BadRequestException(`Failed to get usage info: ${error.message}`);
        }
    }

    @Get('models')
    @ApiOperation({ summary: 'List available Gemini models for current API key' })
    async listModels() {
        try {
            const result = await this.aiService.listModels();
            return {
                success: true,
                data: result,
            };
        } catch (error) {
            throw new BadRequestException(`Failed to list models: ${error.message}`);
        }
    }
}
