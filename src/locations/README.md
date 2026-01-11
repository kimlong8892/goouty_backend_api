# Locations Module - Goong.io Integration

Module này tích hợp với [Goong.io API](https://docs.goong.io/) để cung cấp chức năng tìm kiếm và autocomplete địa điểm tại Việt Nam.

## Cấu hình

Thêm `GOONG_API_KEY` vào file `.env`:

```bash
GOONG_API_KEY=your_goong_api_key_here
```

Để lấy API key, truy cập: https://account.goong.io/

## API Endpoints

### 1. Tìm kiếm địa điểm (Autocomplete)

**Endpoint:** `GET /locations/search`

**Mô tả:** Tìm kiếm địa điểm với autocomplete, phù hợp cho việc chọn điểm đến như "Đà Lạt", "Phú Quốc", v.v.

**Query Parameters:**
- `input` (required): Từ khóa tìm kiếm
- `limit` (optional): Số lượng kết quả trả về (mặc định: 10, max: 20)
- `location` (optional): Tọa độ để tìm kiếm gần đó (format: `lat,lng`)
- `radius` (optional): Bán kính tìm kiếm tính bằng mét
- `more_compound` (optional): Trả về thêm thông tin chi tiết (true/false)

**Ví dụ:**
```bash
# Tìm kiếm "Đà Lạt"
GET /locations/search?input=Đà Lạt&limit=5

# Tìm kiếm gần một vị trí cụ thể
GET /locations/search?input=Phú Quốc&location=10.762622,106.660172&radius=50000
```

**Response:**
```json
{
  "success": true,
  "data": {
    "predictions": [
      {
        "description": "Đà Lạt, Lâm Đồng, Việt Nam",
        "place_id": "ChIJBwVIBKcpdTERLEfQnwfzOjA",
        "reference": "ChIJBwVIBKcpdTERLEfQnwfzOjA",
        "matched_substrings": [...],
        "structured_formatting": {
          "main_text": "Đà Lạt",
          "secondary_text": "Lâm Đồng, Việt Nam"
        },
        "terms": [...]
      }
    ],
    "status": "OK"
  }
}
```

### 2. Lấy thông tin chi tiết địa điểm

**Endpoint:** `GET /locations/detail`

**Mô tả:** Lấy thông tin chi tiết về một địa điểm dựa trên `place_id`

**Query Parameters:**
- `place_id` (required): ID của địa điểm từ kết quả tìm kiếm

**Ví dụ:**
```bash
GET /locations/detail?place_id=ChIJBwVIBKcpdTERLEfQnwfzOjA
```

**Response:**
```json
{
  "success": true,
  "data": {
    "result": {
      "place_id": "ChIJBwVIBKcpdTERLEfQnwfzOjA",
      "name": "Đà Lạt",
      "formatted_address": "Đà Lạt, Lâm Đồng, Việt Nam",
      "geometry": {
        "location": {
          "lat": 11.9404,
          "lng": 108.4583
        }
      },
      "address_components": [...],
      "types": ["locality", "political"]
    },
    "status": "OK"
  }
}
```

### 3. Tìm kiếm điểm đến du lịch

**Endpoint:** `GET /locations/destinations`

**Mô tả:** Endpoint đơn giản hóa để tìm kiếm các điểm đến du lịch phổ biến

**Query Parameters:**
- `query` (required): Từ khóa tìm kiếm
- `limit` (optional): Số lượng kết quả (mặc định: 10)

**Ví dụ:**
```bash
GET /locations/destinations?query=Nha Trang&limit=5
```

## Sử dụng trong Frontend

### Ví dụ với Axios:

```typescript
import axios from 'axios';

// Tìm kiếm địa điểm
const searchLocations = async (query: string) => {
  try {
    const response = await axios.get('/locations/search', {
      params: {
        input: query,
        limit: 10,
        more_compound: 'true'
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data.predictions;
  } catch (error) {
    console.error('Error searching locations:', error);
    throw error;
  }
};

// Lấy chi tiết địa điểm
const getLocationDetail = async (placeId: string) => {
  try {
    const response = await axios.get('/locations/detail', {
      params: {
        place_id: placeId
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data.result;
  } catch (error) {
    console.error('Error getting location detail:', error);
    throw error;
  }
};
```

### Ví dụ với React Component:

```tsx
import React, { useState, useEffect } from 'react';

const LocationSearch = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchLocations = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `/locations/search?input=${encodeURIComponent(query)}&limit=5`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        const data = await response.json();
        setSuggestions(data.data.predictions || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchLocations, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Tìm kiếm địa điểm..."
      />
      {loading && <div>Đang tìm kiếm...</div>}
      <ul>
        {suggestions.map((place) => (
          <li key={place.place_id}>
            {place.description}
          </li>
        ))}
      </ul>
    </div>
  );
};
```

## Authentication

Tất cả các endpoints đều yêu cầu JWT authentication. Đảm bảo gửi token trong header:

```
Authorization: Bearer <your_jwt_token>
```

## Tài liệu tham khảo

- [Goong.io Documentation](https://docs.goong.io/)
- [Place Autocomplete API](https://docs.goong.io/rest/place/#place-autocomplete)
- [Place Detail API](https://docs.goong.io/rest/place/#place-detail)

## Lưu ý

- API key của Goong.io có giới hạn số lượng request. Kiểm tra quota tại: https://account.goong.io/
- Sử dụng debounce khi implement autocomplete để tránh gọi API quá nhiều
- Cache kết quả khi có thể để giảm số lượng request
