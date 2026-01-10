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

  async create(createTripTemplateDto: CreateTripTemplateDto) {
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
      ...createTripTemplateDto
    });
  }

  async findAll(options?: { search?: string; page?: number; limit?: number }) {
    return this.tripTemplatesRepository.findUserTemplates(options);
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

  async findOneForUser(id: string) {
    const template = await this.tripTemplatesRepository.findOne(id);
    if (!template) {
      throw new NotFoundException(`Trip template with ID ${id} not found`);
    }

    return template;
  }

  async update(id: string, updateTripTemplateDto: UpdateTripTemplateDto) {
    // Check if template exists
    await this.findOne(id);

    return this.tripTemplatesRepository.update(id, updateTripTemplateDto);
  }

  async remove(id: string) {
    // Check if template exists
    await this.findOne(id);

    return this.tripTemplatesRepository.remove(id);
  }

  async duplicateTemplate(templateId: string, newTitle?: string) {
    const originalTemplate = await this.findOneForUser(templateId);

    const duplicateData: CreateTripTemplateDto = {
      title: newTitle || `${originalTemplate.title} (Copy)`,
      description: originalTemplate.description,
      avatar: originalTemplate.avatar,
      fee: originalTemplate.fee ? Number(originalTemplate.fee) : 0,
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

    return this.create(duplicateData);
  }

  async createTripFromTemplate(templateId: string, tripTitle?: string) {
    const template = await this.findOneForUser(templateId);

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
  async addToWishlist(userId: string, templateId: string) {
    // Check if template exists
    await this.findOne(templateId);
    return this.tripTemplatesRepository.addToWishlist(userId, templateId);
  }

  async removeFromWishlist(userId: string, templateId: string) {
    // Check if template exists
    await this.findOne(templateId);
    return this.tripTemplatesRepository.removeFromWishlist(userId, templateId);
  }

  async getWishlist(userId: string, query: { page?: number; limit?: number }) {
    return this.tripTemplatesRepository.getUserWishlist(userId, query);
  }
}
