import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { TripTemplatesRepository } from './trip-templates.repository';
import { CreateTripTemplateDto } from './dto/create-trip-template.dto';
import { UpdateTripTemplateDto } from './dto/update-trip-template.dto';
import { GetTripTemplatesQueryDto } from './dto/get-trip-templates-query.dto';

@Injectable()
export class TripTemplatesService {
  constructor(
    private readonly tripTemplatesRepository: TripTemplatesRepository,
  ) { }

  async create(createTripTemplateDto: CreateTripTemplateDto, userId: string) {
    // Validate day orders are unique
    if (createTripTemplateDto.days) {
      const dayOrders = createTripTemplateDto.days.map(day => day.dayOrder);
      const uniqueDayOrders = new Set(dayOrders);
      if (dayOrders.length !== uniqueDayOrders.size) {
        throw new BadRequestException('Day orders must be unique');
      }

      // Validate activity orders are unique within each day
      for (const day of createTripTemplateDto.days) {
        if (day.activities) {
          const activityOrders = day.activities.map(activity => activity.activityOrder);
          const uniqueActivityOrders = new Set(activityOrders);
          if (activityOrders.length !== uniqueActivityOrders.size) {
            throw new BadRequestException(`Activity orders must be unique within day "${day.title}"`);
          }
        }
      }
    }

    return this.tripTemplatesRepository.create({
      ...createTripTemplateDto,
      userId
    });
  }

  async findAll(userId: string, options?: { search?: string; page?: number; limit?: number }) {
    return this.tripTemplatesRepository.findUserTemplates(userId, options);
  }

  async findPublicTemplates(query: GetTripTemplatesQueryDto) {
    return this.tripTemplatesRepository.findPublicTemplates(query);
  }

  async findOne(id: string) {
    const template = await this.tripTemplatesRepository.findOne(id);
    if (!template) {
      throw new NotFoundException(`Trip template with ID ${id} not found`);
    }
    return template;
  }

  async findOneForUser(id: string, requestUserId?: string) {
    const template = await this.tripTemplatesRepository.findOne(id);
    if (!template) {
      throw new NotFoundException(`Trip template with ID ${id} not found`);
    }

    // Allow if template is public
    if (template.isPublic) {
      return template;
    }

    // Allow if user is the owner
    if (requestUserId && template.userId === requestUserId) {
      return template;
    }

    throw new ForbiddenException('You do not have permission to view this trip template');
  }

  async update(id: string, updateTripTemplateDto: UpdateTripTemplateDto, requestUserId: string) {
    // Check if template exists
    const existingTemplate = await this.findOne(id);

    // Check if the requesting user is the template owner
    if (existingTemplate.userId !== requestUserId) {
      throw new ForbiddenException('Only template owner can update the template');
    }

    return this.tripTemplatesRepository.update(id, updateTripTemplateDto);
  }

  async remove(id: string, requestUserId: string) {
    // Check if template exists
    const template = await this.findOne(id);

    // Check if the requesting user is the template owner
    if (template.userId !== requestUserId) {
      throw new ForbiddenException('Only template owner can delete the template');
    }

    return this.tripTemplatesRepository.remove(id);
  }

  async duplicateTemplate(templateId: string, userId: string, newTitle?: string) {
    const originalTemplate = await this.findOneForUser(templateId, userId);

    const duplicateData: CreateTripTemplateDto = {
      title: newTitle || `${originalTemplate.title} (Copy)`,
      description: originalTemplate.description,
      avatar: originalTemplate.avatar,
      provinceId: originalTemplate.provinceId,
      isPublic: false, // Duplicated templates are private by default
      days: originalTemplate.days.map(day => ({
        title: day.title,
        description: day.description,
        dayOrder: day.dayOrder,
        activities: day.activities.map(activity => ({
          title: activity.title,
          startTime: activity.startTime,
          durationMin: activity.durationMin,
          location: activity.location,
          notes: activity.notes,
          important: activity.important,
          activityOrder: activity.activityOrder,
        }))
      }))
    };

    return this.create(duplicateData, userId);
  }

  async createTripFromTemplate(templateId: string, userId: string, tripTitle?: string) {
    const template = await this.findOneForUser(templateId, userId);

    // This would typically integrate with the trips service
    // For now, we'll return the template data that can be used to create a trip
    return {
      template,
      suggestedTripData: {
        title: tripTitle || template.title,
        description: template.description,
        provinceId: template.provinceId,
        days: template.days.map(day => ({
          title: day.title,
          description: day.description,
          activities: day.activities.map(activity => ({
            title: activity.title,
            startTime: activity.startTime,
            durationMin: activity.durationMin,
            location: activity.location,
            notes: activity.notes,
            important: activity.important,
          }))
        }))
      }
    };
  }
}
