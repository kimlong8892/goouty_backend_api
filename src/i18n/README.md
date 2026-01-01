# I18n (Internationalization) - Hướng dẫn sử dụng

## Tổng quan

Backend đã được cấu hình i18n với **tiếng Việt** làm ngôn ngữ mặc định. Hệ thống hỗ trợ:
- ✅ Tiếng Việt (vi) - Mặc định
- ✅ Tiếng Anh (en) - Fallback

## Cấu trúc thư mục

```
src/
├── i18n/
│   ├── vi/           # Tiếng Việt
│   │   ├── common.json
│   │   ├── auth.json
│   │   ├── trips.json
│   │   └── users.json
│   └── en/           # Tiếng Anh
│       ├── common.json
│       ├── auth.json
│       ├── trips.json
│       └── users.json
└── common/
    ├── i18n/
    │   └── translation.service.ts
    └── decorators/
        └── i18n.decorator.ts
```

## Cách sử dụng

### 1. Trong Controller

#### Sử dụng I18nService trực tiếp

```typescript
import { Controller, Get } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

@Controller('example')
export class ExampleController {
  constructor(private readonly i18n: I18nService) {}

  @Get()
  async getExample() {
    // Tự động lấy ngôn ngữ từ request
    const message = await this.i18n.translate('common.success');
    
    return {
      message, // "Thành công" (nếu client gửi Accept-Language: vi)
    };
  }
}
```

#### Sử dụng decorator @Lang()

```typescript
import { Controller, Get } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Lang } from '../common/decorators/i18n.decorator';

@Controller('example')
export class ExampleController {
  constructor(private readonly i18n: I18nService) {}

  @Get()
  async getExample(@Lang() lang: string) {
    const message = await this.i18n.translate('auth.login.success', {
      lang: lang,
    });
    
    return { message, currentLang: lang };
  }
}
```

#### Sử dụng với tham số

```typescript
@Get('user/:name')
async greetUser(@Param('name') name: string, @Lang() lang: string) {
  const message = await this.i18n.translate('common.validation.required', {
    lang: lang,
    args: { field: name },
  });
  
  return { message }; // "name là bắt buộc"
}
```

### 2. Trong Service

```typescript
import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class AuthService {
  constructor(private readonly i18n: I18nService) {}

  async login(loginDto: LoginDto) {
    // Logic đăng nhập...
    
    return {
      message: await this.i18n.translate('auth.login.success', {
        lang: 'vi', // Hoặc lấy từ context
      }),
      data: user,
    };
  }
}
```

### 3. Sử dụng TranslationService (Helper)

```typescript
import { Injectable } from '@nestjs/common';
import { TranslationService } from '../common/i18n/translation.service';

@Injectable()
export class TripService {
  constructor(private readonly translation: TranslationService) {}

  async createTrip(createTripDto: CreateTripDto) {
    // Logic tạo trip...
    
    return {
      message: this.translation.t('trips.trip.created'),
      data: trip,
    };
  }
}
```

## Cách client gửi ngôn ngữ

### 1. Qua Header (Khuyến nghị)

```bash
curl -H "Accept-Language: vi" http://localhost:3000/api/trips
curl -H "Accept-Language: en" http://localhost:3000/api/trips
```

### 2. Qua Query Parameter

```bash
curl http://localhost:3000/api/trips?lang=vi
curl http://localhost:3000/api/trips?lang=en
```

### 3. Qua Custom Header

```bash
curl -H "x-custom-lang: vi" http://localhost:3000/api/trips
```

## Thêm translation mới

### 1. Thêm vào file JSON hiện có

**src/i18n/vi/auth.json**
```json
{
  "login": {
    "success": "Đăng nhập thành công",
    "twoFactorRequired": "Yêu cầu xác thực 2 bước"  // ← Thêm mới
  }
}
```

**src/i18n/en/auth.json**
```json
{
  "login": {
    "success": "Login successful",
    "twoFactorRequired": "Two-factor authentication required"  // ← Thêm mới
  }
}
```

### 2. Tạo file translation mới cho module mới

**src/i18n/vi/payments.json**
```json
{
  "payment": {
    "success": "Thanh toán thành công",
    "failed": "Thanh toán thất bại"
  }
}
```

**src/i18n/en/payments.json**
```json
{
  "payment": {
    "success": "Payment successful",
    "failed": "Payment failed"
  }
}
```

## Ví dụ thực tế

### Auth Controller với i18n

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly i18n: I18nService,
  ) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      const user = await this.authService.login(loginDto);
      
      return {
        message: await this.i18n.translate('auth.login.success'),
        data: user,
      };
    } catch (error) {
      throw new UnauthorizedException(
        await this.i18n.translate('auth.login.invalidCredentials')
      );
    }
  }
}
```

## Validation với i18n

```typescript
import { IsNotEmpty, IsEmail } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class LoginDto {
  @IsNotEmpty({ message: i18nValidationMessage('common.validation.required') })
  @IsEmail({}, { message: i18nValidationMessage('common.validation.email') })
  email: string;

  @IsNotEmpty({ message: i18nValidationMessage('common.validation.required') })
  password: string;
}
```

## Best Practices

1. **Luôn cung cấp cả 2 ngôn ngữ**: Khi thêm key mới, thêm vào cả `vi` và `en`
2. **Sử dụng namespace rõ ràng**: `module.feature.action` (vd: `auth.login.success`)
3. **Tránh hardcode message**: Luôn sử dụng i18n cho tất cả user-facing messages
4. **Test cả 2 ngôn ngữ**: Đảm bảo translation hoạt động đúng cho cả vi và en
5. **Sử dụng fallback**: Hệ thống sẽ tự động fallback sang tiếng Việt nếu không tìm thấy translation

## Ngôn ngữ mặc định

- **Mặc định**: Tiếng Việt (vi)
- **Fallback**: Tiếng Việt (vi)
- Nếu client không gửi ngôn ngữ → Sử dụng tiếng Việt
- Nếu client gửi ngôn ngữ không hỗ trợ → Fallback sang tiếng Việt

## Troubleshooting

### Translation không hoạt động?

1. Kiểm tra file JSON có đúng format không
2. Kiểm tra key có tồn tại trong cả 2 ngôn ngữ không
3. Kiểm tra client có gửi header Accept-Language đúng không
4. Restart server sau khi thêm file translation mới

### Làm sao để debug?

```typescript
@Get('debug')
async debug(@Lang() lang: string) {
  return {
    currentLang: lang,
    message: await this.i18n.translate('common.success', { lang }),
  };
}
```
