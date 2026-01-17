import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as Tesseract from 'tesseract.js';
import axios from 'axios';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private genAI: GoogleGenerativeAI;

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (apiKey && apiKey !== 'GEMINI_API_KEY') {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.logger.log(`Gemini API initialized. Key starts with: ${apiKey.substring(0, 6)}...`);
        } else {
            this.logger.warn('GEMINI_API_KEY is not set or is using placeholder value');
        }
    }

    async processBillImage(file: Express.Multer.File): Promise<{ name: string; total: number }> {
        if (!this.genAI) {
            throw new Error('Gemini API is not configured. Please set GEMINI_API_KEY in .env file.');
        }

        try {
            this.logger.log(`Processing bill image directly with Gemini (${file.size} bytes)...`);

            const modelNames = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
            let lastError;

            // Prepare the image for Gemini
            const imageData = {
                inlineData: {
                    data: file.buffer.toString('base64'),
                    mimeType: file.mimetype,
                },
            };

            for (const modelName of modelNames) {
                try {
                    this.logger.log(`Trying model: ${modelName}...`);
                    const model = this.genAI.getGenerativeModel({ model: modelName });

                    const prompt = `
            Analyze this bill/receipt image and extract:
            1. Store/Merchant name (Tên cửa hàng/đơn vị phát hành hóa đơn)
            2. Total amount (as a number, remove any separators like dots or commas that are not decimals)
            
            Return the result in JSON format:
            {
              "name": "string",
              "total": number
            }
            
            Note for Vietnamese bills: 
            - Store name is usually at the very top.
            - Total is often labeled as "Tổng cộng", "Thanh toán", "Thành tiền", or "Tổng thanh toán".
            - If you see multiple totals, use the final amount after discounts and taxes.
            - If total is "100.000", return 100000.
            
            If you cannot find the name, use "Hóa đơn không rõ tên".
            If you cannot find the total, try to manually sum the items if visible. If still not found, return 0.
            Only return the JSON, no other text.
          `;

                    const result = await model.generateContent([prompt, imageData]);
                    const response = await result.response;
                    const text = response.text();

                    const jsonStr = text.replace(/```json|```/g, '').trim();
                    const parsed = JSON.parse(jsonStr);

                    return {
                        name: parsed.name || 'Hóa đơn không rõ tên',
                        total: parsed.total || 0,
                    };
                } catch (error) {
                    this.logger.warn(`Model ${modelName} failed: ${error.message}`);
                    lastError = error;
                    if (error.message.includes('404')) continue;
                    continue;
                }
            }

            throw lastError || new Error('All models failed to process the request.');
        } catch (error) {
            this.logger.error(`Error processing bill: ${error.message}`);
            throw error;
        }
    }

    async listModels() {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (!apiKey) return { error: 'No API Key' };

        try {
            const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
            return response.data;
        } catch (error) {
            this.logger.error(`Error listing models: ${error.message}`);
            return {
                error: error.message,
                details: error.response?.data
            };
        }
    }
}
