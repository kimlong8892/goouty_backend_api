import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CloudTaskGuard implements CanActivate {
    private readonly client = new OAuth2Client();
    private readonly logger = new Logger(CloudTaskGuard.name);

    constructor(private readonly configService: ConfigService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            this.logger.error('Missing or invalid Authorization header in Cloud Task request');
            return false;
        }

        const token = authHeader.split(' ')[1];

        try {
            // Get API URL and normalize it (remove trailing slash)
            let apiUrl = this.configService.get<string>('APP_URL_API');
            if (apiUrl && apiUrl.endsWith('/')) {
                apiUrl = apiUrl.slice(0, -1);
            }

            // Fallback to legacy construction if APP_URL_API is not set
            if (!apiUrl) {
                let baseUrl = this.configService.get<string>('APP_URL');
                if (baseUrl && baseUrl.endsWith('/')) {
                    baseUrl = baseUrl.slice(0, -1);
                }
                apiUrl = `${baseUrl}/api`;
            }

            // Audience must match the exact URL used when creating the task
            const expectedAudience = `${apiUrl}/queue/process`;

            this.logger.debug(`Verifying Cloud Task token. Expected audience: ${expectedAudience}`);

            const ticket = await this.client.verifyIdToken({
                idToken: token,
                audience: expectedAudience,
            });

            const payload = ticket.getPayload();
            if (!payload) {
                throw new Error('Empty payload in OIDC token');
            }

            // Check service account email if configured
            const expectedEmail = this.configService.get<string>('GCP_SERVICE_ACCOUNT_EMAIL');
            if (expectedEmail && payload.email !== expectedEmail) {
                this.logger.error(`OIDC token email mismatch. Expected: ${expectedEmail}, Found: ${payload.email}`);
                return false;
            }

            this.logger.log(`Cloud Task verified successfully for: ${payload.email}`);
            return true;
        } catch (error) {
            this.logger.error(`Cloud Task verification failed: ${error.message}`);
            // If verification fails, we return 401
            return false;
        }
    }
}
