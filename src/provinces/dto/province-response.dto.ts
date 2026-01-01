export class ProvinceResponseDto {
  id: string;
  name: string;
  code: number;
  divisionType: string;
  codename: string;
  phoneCode: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(province: any) {
    this.id = province.id;
    this.name = province.name;
    this.code = province.code;
    this.divisionType = province.divisionType;
    this.codename = province.codename;
    this.phoneCode = province.phoneCode;
    this.createdAt = province.createdAt;
    this.updatedAt = province.updatedAt;
  }
}
