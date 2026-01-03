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
            this.logger.error('Missing or invalid Authorization header');
            throw new UnauthorizedException('Missing or invalid Authorization header');
        }

        const token = authHeader.split(' ')[1];

        try {
            // The audience is usually the URL of the request
            // Note: If you have a custom domain/proxy, make sure this matches the target URL configured in Cloud Tasks
            const baseUrl = this.configService.get<string>('APP_URL');
            const audience = `${baseUrl}/api/queue/process`.replace(/\/+$/, '');

            this.logger.debug(`Verifying OIDC token for audience: ${audience}`);

            const ticket = await this.client.verifyIdToken({
                idToken: token,
                audience: audience,
            });

            const payload = ticket.getPayload();

            // Additional checks if necessary
            // e.g., check the service account email
            const expectedEmail = this.configService.get<string>('GCP_SERVICE_ACCOUNT_EMAIL');
            if (expectedEmail && payload.email !== expectedEmail) {
                this.logger.error(`OIDC token email mismatch. Expected: ${expectedEmail}, Found: ${payload.email}`);
                throw new UnauthorizedException('Service account email mismatch');
            }

            this.logger.debug(`OIDC token verified for ${payload.email}`);
            return true;
        } catch (error) {
            this.logger.error(`OIDC token verification failed: ${error.message}`);
            throw new UnauthorizedException('Invalid OIDC token');
        }
    }
}
