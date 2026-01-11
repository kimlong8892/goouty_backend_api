import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProvinceInfo {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  code: number;

  @ApiProperty()
  divisionType: string;

  @ApiProperty()
  codename: string;

  @ApiProperty()
  phoneCode: number;
}

export class TripResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  provinceId?: string;

  @ApiPropertyOptional()
  province?: ProvinceInfo;

  @ApiPropertyOptional()
  startDate?: Date;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  userId: string;

  @ApiPropertyOptional()
  shareToken?: string;

  @ApiPropertyOptional()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Template ID if trip was created from a template' })
  templateId?: string;

  @ApiPropertyOptional()
  createdAt?: Date;

  @ApiPropertyOptional()
  updatedAt?: Date;
}
