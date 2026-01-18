import { Module } from '@nestjs/common';
import { InternalController } from './internal.controller';
import { EmailModule } from '../email/email.module';

@Module({
    imports: [EmailModule],
    controllers: [InternalController],
})
export class InternalModule { }
