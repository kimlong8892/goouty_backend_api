import { IsOptional, IsString } from 'class-validator';

export class GetProvincesQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  divisionType?: string;
}
