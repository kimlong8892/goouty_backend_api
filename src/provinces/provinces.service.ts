import { Injectable, NotFoundException } from '@nestjs/common';
import { ProvincesRepository } from './provinces.repository';
import { GetProvincesQueryDto } from './dto/get-provinces-query.dto';
import { ProvinceResponseDto } from './dto/province-response.dto';

@Injectable()
export class ProvincesService {
  constructor(private provincesRepository: ProvincesRepository) {}

  async findAllProvinces(query: GetProvincesQueryDto) {
    const provinces = await this.provincesRepository.findAllProvinces(query);

    return {
      data: provinces.map(province => new ProvinceResponseDto(province)),
      total: provinces.length,
    };
  }

  async findProvinceById(id: string) {
    const province = await this.provincesRepository.findProvinceById(id);
    if (!province) {
      throw new NotFoundException(`Province with ID ${id} not found`);
    }
    return new ProvinceResponseDto(province);
  }

  async findProvinceByCode(code: number) {
    const province = await this.provincesRepository.findProvinceByCode(code);
    if (!province) {
      throw new NotFoundException(`Province with code ${code} not found`);
    }
    return new ProvinceResponseDto(province);
  }
}
