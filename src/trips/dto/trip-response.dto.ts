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
  endDate?: Date;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  userId: string;

  @ApiPropertyOptional()
  shareToken?: string;

  @ApiPropertyOptional()
  isPublic?: boolean;

  @ApiPropertyOptional()
  createdAt?: Date;

  @ApiPropertyOptional()
  updatedAt?: Date;
}
