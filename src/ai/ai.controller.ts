import {
    Controller,
    Post,
    Get,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AiService } from './ai.service';

@ApiTags('AI')
@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Post('process-bill')
    @UseInterceptors(FileInterceptor('image'))
    @ApiOperation({ summary: 'Process bill image using Gemini AI to get total amount' })
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
    async processBill(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No image file provided');
        }

        if (!file.mimetype.startsWith('image/')) {
            throw new BadRequestException('File must be an image');
        }

        try {
            const result = await this.aiService.processBillImage(file);
            return {
                success: true,
                data: result,
            };
        } catch (error) {
            throw new BadRequestException(`Failed to process bill: ${error.message}`);
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
