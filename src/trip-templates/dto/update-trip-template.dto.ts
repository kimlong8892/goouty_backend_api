import { PartialType } from '@nestjs/swagger';
import { CreateTripTemplateDto } from './create-trip-template.dto';

export class UpdateTripTemplateDto extends PartialType(CreateTripTemplateDto) {}
