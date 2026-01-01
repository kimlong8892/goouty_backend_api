import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const vietnameseProvinces = [
  { name: "Thành phố Hà Nội", code: 1, divisionType: "tỉnh", codename: "thanh_pho_ha_noi", phoneCode: 24 },
  { name: "Tỉnh Hà Giang", code: 2, divisionType: "tỉnh", codename: "tinh_ha_giang", phoneCode: 219 },
  { name: "Tỉnh Cao Bằng", code: 4, divisionType: "tỉnh", codename: "tinh_cao_bang", phoneCode: 206 },
  { name: "Tỉnh Bắc Kạn", code: 6, divisionType: "tỉnh", codename: "tinh_bac_kan", phoneCode: 209 },
  { name: "Tỉnh Tuyên Quang", code: 8, divisionType: "tỉnh", codename: "tinh_tuyen_quang", phoneCode: 207 },
  { name: "Tỉnh Lào Cai", code: 10, divisionType: "tỉnh", codename: "tinh_lao_cai", phoneCode: 214 },
  { name: "Tỉnh Điện Biên", code: 11, divisionType: "tỉnh", codename: "tinh_dien_bien", phoneCode: 215 },
  { name: "Tỉnh Lai Châu", code: 12, divisionType: "tỉnh", codename: "tinh_lai_chau", phoneCode: 213 },
  { name: "Tỉnh Sơn La", code: 14, divisionType: "tỉnh", codename: "tinh_son_la", phoneCode: 212 },
  { name: "Tỉnh Yên Bái", code: 15, divisionType: "tỉnh", codename: "tinh_yen_bai", phoneCode: 216 },
  { name: "Tỉnh Hoà Bình", code: 17, divisionType: "tỉnh", codename: "tinh_hoa_binh", phoneCode: 218 },
  { name: "Tỉnh Thái Nguyên", code: 19, divisionType: "tỉnh", codename: "tinh_thai_nguyen", phoneCode: 208 },
  { name: "Tỉnh Lạng Sơn", code: 20, divisionType: "tỉnh", codename: "tinh_lang_son", phoneCode: 205 },
  { name: "Tỉnh Quảng Ninh", code: 22, divisionType: "tỉnh", codename: "tinh_quang_ninh", phoneCode: 203 },
  { name: "Tỉnh Bắc Giang", code: 24, divisionType: "tỉnh", codename: "tinh_bac_giang", phoneCode: 204 },
  { name: "Tỉnh Phú Thọ", code: 25, divisionType: "tỉnh", codename: "tinh_phu_tho", phoneCode: 210 },
  { name: "Tỉnh Vĩnh Phúc", code: 26, divisionType: "tỉnh", codename: "tinh_vinh_phuc", phoneCode: 211 },
  { name: "Tỉnh Bắc Ninh", code: 27, divisionType: "tỉnh", codename: "tinh_bac_ninh", phoneCode: 222 },
  { name: "Tỉnh Hải Dương", code: 30, divisionType: "tỉnh", codename: "tinh_hai_duong", phoneCode: 220 },
  { name: "Thành phố Hải Phòng", code: 31, divisionType: "tỉnh", codename: "thanh_pho_hai_phong", phoneCode: 225 },
  { name: "Tỉnh Hưng Yên", code: 33, divisionType: "tỉnh", codename: "tinh_hung_yen", phoneCode: 221 },
  { name: "Tỉnh Thái Bình", code: 34, divisionType: "tỉnh", codename: "tinh_thai_binh", phoneCode: 227 },
  { name: "Tỉnh Hà Nam", code: 35, divisionType: "tỉnh", codename: "tinh_ha_nam", phoneCode: 226 },
  { name: "Tỉnh Nam Định", code: 36, divisionType: "tỉnh", codename: "tinh_nam_dinh", phoneCode: 228 },
  { name: "Tỉnh Ninh Bình", code: 37, divisionType: "tỉnh", codename: "tinh_ninh_binh", phoneCode: 229 },
  { name: "Tỉnh Thanh Hóa", code: 38, divisionType: "tỉnh", codename: "tinh_thanh_hoa", phoneCode: 237 },
  { name: "Tỉnh Nghệ An", code: 40, divisionType: "tỉnh", codename: "tinh_nghe_an", phoneCode: 238 },
  { name: "Tỉnh Hà Tĩnh", code: 42, divisionType: "tỉnh", codename: "tinh_ha_tinh", phoneCode: 239 },
  { name: "Tỉnh Quảng Bình", code: 44, divisionType: "tỉnh", codename: "tinh_quang_binh", phoneCode: 232 },
  { name: "Tỉnh Quảng Trị", code: 45, divisionType: "tỉnh", codename: "tinh_quang_tri", phoneCode: 233 },
  { name: "Thành phố Huế", code: 46, divisionType: "tỉnh", codename: "thanh_pho_hue", phoneCode: 234 },
  { name: "Thành phố Đà Nẵng", code: 48, divisionType: "tỉnh", codename: "thanh_pho_da_nang", phoneCode: 236 },
  { name: "Tỉnh Quảng Nam", code: 49, divisionType: "tỉnh", codename: "tinh_quang_nam", phoneCode: 235 },
  { name: "Tỉnh Quảng Ngãi", code: 51, divisionType: "tỉnh", codename: "tinh_quang_ngai", phoneCode: 255 },
  { name: "Tỉnh Bình Định", code: 52, divisionType: "tỉnh", codename: "tinh_binh_dinh", phoneCode: 256 },
  { name: "Tỉnh Phú Yên", code: 54, divisionType: "tỉnh", codename: "tinh_phu_yen", phoneCode: 257 },
  { name: "Tỉnh Khánh Hòa", code: 56, divisionType: "tỉnh", codename: "tinh_khanh_hoa", phoneCode: 258 },
  { name: "Tỉnh Ninh Thuận", code: 58, divisionType: "tỉnh", codename: "tinh_ninh_thuan", phoneCode: 259 },
  { name: "Tỉnh Bình Thuận", code: 60, divisionType: "tỉnh", codename: "tinh_binh_thuan", phoneCode: 252 },
  { name: "Tỉnh Kon Tum", code: 62, divisionType: "tỉnh", codename: "tinh_kon_tum", phoneCode: 260 },
  { name: "Tỉnh Gia Lai", code: 64, divisionType: "tỉnh", codename: "tinh_gia_lai", phoneCode: 269 },
  { name: "Tỉnh Đắk Lắk", code: 66, divisionType: "tỉnh", codename: "tinh_dak_lak", phoneCode: 262 },
  { name: "Tỉnh Đắk Nông", code: 67, divisionType: "tỉnh", codename: "tinh_dak_nong", phoneCode: 261 },
  { name: "Tỉnh Lâm Đồng", code: 68, divisionType: "tỉnh", codename: "tinh_lam_dong", phoneCode: 263 },
  { name: "Tỉnh Bình Phước", code: 70, divisionType: "tỉnh", codename: "tinh_binh_phuoc", phoneCode: 271 },
  { name: "Tỉnh Tây Ninh", code: 72, divisionType: "tỉnh", codename: "tinh_tay_ninh", phoneCode: 276 },
  { name: "Tỉnh Bình Dương", code: 74, divisionType: "tỉnh", codename: "tinh_binh_duong", phoneCode: 274 },
  { name: "Tỉnh Đồng Nai", code: 75, divisionType: "tỉnh", codename: "tinh_dong_nai", phoneCode: 251 },
  { name: "Tỉnh Bà Rịa - Vũng Tàu", code: 77, divisionType: "tỉnh", codename: "tinh_ba_ria_vung_tau", phoneCode: 254 },
  { name: "Thành phố Hồ Chí Minh", code: 79, divisionType: "tỉnh", codename: "thanh_pho_ho_chi_minh", phoneCode: 28 },
  { name: "Tỉnh Long An", code: 80, divisionType: "tỉnh", codename: "tinh_long_an", phoneCode: 272 },
  { name: "Tỉnh Tiền Giang", code: 82, divisionType: "tỉnh", codename: "tinh_tien_giang", phoneCode: 273 },
  { name: "Tỉnh Bến Tre", code: 83, divisionType: "tỉnh", codename: "tinh_ben_tre", phoneCode: 275 },
  { name: "Tỉnh Trà Vinh", code: 84, divisionType: "tỉnh", codename: "tinh_tra_vinh", phoneCode: 294 },
  { name: "Tỉnh Vĩnh Long", code: 86, divisionType: "tỉnh", codename: "tinh_vinh_long", phoneCode: 270 },
  { name: "Tỉnh Đồng Tháp", code: 87, divisionType: "tỉnh", codename: "tinh_dong_thap", phoneCode: 277 },
  { name: "Tỉnh An Giang", code: 89, divisionType: "tỉnh", codename: "tinh_an_giang", phoneCode: 296 },
  { name: "Tỉnh Kiên Giang", code: 91, divisionType: "tỉnh", codename: "tinh_kien_giang", phoneCode: 297 },
  { name: "Thành phố Cần Thơ", code: 92, divisionType: "tỉnh", codename: "thanh_pho_can_tho", phoneCode: 292 },
  { name: "Tỉnh Hậu Giang", code: 93, divisionType: "tỉnh", codename: "tinh_hau_giang", phoneCode: 293 },
  { name: "Tỉnh Sóc Trăng", code: 94, divisionType: "tỉnh", codename: "tinh_soc_trang", phoneCode: 299 },
  { name: "Tỉnh Bạc Liêu", code: 95, divisionType: "tỉnh", codename: "tinh_bac_lieu", phoneCode: 291 },
  { name: "Tỉnh Cà Mau", code: 96, divisionType: "tỉnh", codename: "tinh_ca_mau", phoneCode: 290 },
];

async function main() {
  console.log('Starting to seed Vietnamese provinces...');

  // Clear existing data
  await prisma.province.deleteMany();

  // Insert provinces
  for (const provinceData of vietnameseProvinces) {
    await prisma.province.create({
      data: provinceData,
    });
  }

  console.log(`Seeded ${vietnameseProvinces.length} provinces successfully!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
