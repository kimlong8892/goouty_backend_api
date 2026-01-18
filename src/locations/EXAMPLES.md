# Ví dụ sử dụng Locations API

## 1. Tìm kiếm địa điểm du lịch phổ biến tại Việt Nam

### Đà Lạt
```bash
curl -X GET "http://localhost:3000/locations/search?input=Đà Lạt&limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Phú Quốc
```bash
curl -X GET "http://localhost:3000/locations/search?input=Phú Quốc&limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Nha Trang
```bash
curl -X GET "http://localhost:3000/locations/search?input=Nha Trang&limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Hội An
```bash
curl -X GET "http://localhost:3000/locations/search?input=Hội An&limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Sapa
```bash
curl -X GET "http://localhost:3000/locations/search?input=Sapa&limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Vịnh Hạ Long
```bash
curl -X GET "http://localhost:3000/locations/search?input=Vịnh Hạ Long&limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 2. Tìm kiếm với autocomplete (gõ dần)

### Gõ "Đà"
```bash
curl -X GET "http://localhost:3000/locations/search?input=Đà&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Gõ "Phú"
```bash
curl -X GET "http://localhost:3000/locations/search?input=Phú&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 3. Tìm kiếm gần vị trí hiện tại

### Tìm "quán cafe" gần Sài Gòn (10.762622, 106.660172)
```bash
curl -X GET "http://localhost:3000/locations/search?input=quán cafe&location=10.762622,106.660172&radius=5000&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Tìm "nhà hàng" gần Hà Nội (21.028511, 105.804817)
```bash
curl -X GET "http://localhost:3000/locations/search?input=nhà hàng&location=21.028511,105.804817&radius=3000&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 4. Lấy thông tin chi tiết địa điểm

### Lấy thông tin Đà Lạt
```bash
curl -X GET "http://localhost:3000/locations/detail?place_id=ChIJBwVIBKcpdTERLEfQnwfzOjA" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 5. Sử dụng endpoint destinations (đơn giản hóa)

```bash
curl -X GET "http://localhost:3000/locations/destinations?query=Đà Lạt&limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Response mẫu

### Search Response
```json
{
  "success": true,
  "data": {
    "predictions": [
      {
        "description": "Đà Lạt, Lâm Đồng, Việt Nam",
        "place_id": "ChIJBwVIBKcpdTERLEfQnwfzOjA",
        "reference": "ChIJBwVIBKcpdTERLEfQnwfzOjA",
        "matched_substrings": [
          {
            "length": 7,
            "offset": 0
          }
        ],
        "structured_formatting": {
          "main_text": "Đà Lạt",
          "main_text_matched_substrings": [
            {
              "length": 7,
              "offset": 0
            }
          ],
          "secondary_text": "Lâm Đồng, Việt Nam"
        },
        "terms": [
          {
            "offset": 0,
            "value": "Đà Lạt"
          },
          {
            "offset": 8,
            "value": "Lâm Đồng"
          },
          {
            "offset": 18,
            "value": "Việt Nam"
          }
        ],
        "types": [
          "locality",
          "political",
          "geocode"
        ]
      }
    ],
    "status": "OK"
  }
}
```

### Detail Response
```json
{
  "success": true,
  "data": {
    "result": {
      "address_components": [
        {
          "long_name": "Đà Lạt",
          "short_name": "Đà Lạt",
          "types": ["locality", "political"]
        },
        {
          "long_name": "Lâm Đồng",
          "short_name": "Lâm Đồng",
          "types": ["administrative_area_level_1", "political"]
        },
        {
          "long_name": "Việt Nam",
          "short_name": "VN",
          "types": ["country", "political"]
        }
      ],
      "formatted_address": "Đà Lạt, Lâm Đồng, Việt Nam",
      "geometry": {
        "location": {
          "lat": 11.9404,
          "lng": 108.4583
        },
        "viewport": {
          "northeast": {
            "lat": 12.0158,
            "lng": 108.5089
          },
          "southwest": {
            "lat": 11.8650,
            "lng": 108.4077
          }
        }
      },
      "name": "Đà Lạt",
      "place_id": "ChIJBwVIBKcpdTERLEfQnwfzOjA",
      "types": ["locality", "political"]
    },
    "status": "OK"
  }
}
```

## Danh sách các điểm đến du lịch phổ biến để test

1. **Miền Bắc:**
   - Hà Nội
   - Sapa
   - Vịnh Hạ Long
   - Ninh Bình
   - Mai Châu
   - Cát Bà

2. **Miền Trung:**
   - Đà Nẵng
   - Hội An
   - Huế
   - Quy Nhơn
   - Phong Nha

3. **Miền Nam:**
   - Sài Gòn / TP. Hồ Chí Minh
   - Đà Lạt
   - Phú Quốc
   - Nha Trang
   - Vũng Tàu
   - Mũi Né
   - Cần Thơ
   - Côn Đảo

## Tips

1. **Debounce**: Khi implement autocomplete, sử dụng debounce ~300ms để tránh gọi API quá nhiều
2. **Cache**: Cache kết quả tìm kiếm để giảm số lượng request
3. **Limit**: Sử dụng limit phù hợp (5-10 kết quả) cho autocomplete
4. **Error Handling**: Luôn xử lý lỗi khi API không khả dụng hoặc key hết quota
