import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { CloudTasksModule } from '../cloud-tasks/cloud-tasks.module';

@Module({
  imports: [CloudTasksModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule { }


