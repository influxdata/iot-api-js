# API Reference

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/devices` | GET | List all devices |
| `/api/devices/:id` | GET | Get device by ID |
| `/api/devices/create` | POST | Register a new device |
| `/api/devices/:id/measurements` | POST | Query device telemetry |

## Device Endpoints

### List Devices

```http
GET /api/devices
```

**Response:** `200 OK`
```json
[
  { "deviceId": "sensor-001", "key": "device_sensor-001_1234567890", "updatedAt": "2024-01-01T00:00:00Z" },
  { "deviceId": "sensor-002", "key": "device_sensor-002_1234567891", "updatedAt": "2024-01-01T00:00:01Z" }
]
```

### Get Device

```http
GET /api/devices/:deviceId
```

**Response:** `200 OK`
```json
[
  { "deviceId": "sensor-001", "key": "device_sensor-001_1234567890", "updatedAt": "2024-01-01T00:00:00Z" }
]
```

### Create Device

```http
POST /api/devices/create
Content-Type: application/json

{ "deviceId": "sensor-001" }
```

**Validation:**
- `deviceId` required, 1-64 characters
- Alphanumeric, hyphens, underscores only
- Pattern: `^[a-zA-Z0-9_-]{1,64}$`

**Response:** `200 OK`
```json
{
  "deviceId": "sensor-001",
  "key": "device_sensor-001_1234567890",
  "token": "iot_abc123...",
  "database": "iot_center",
  "host": "http://localhost:8181",
  "message": "Device registered successfully."
}
```

**Errors:**
- `400` - Invalid or missing deviceId
- `500` - Device already exists (should be 409)

## Measurement Endpoints

### Query Measurements

```http
POST /api/devices/:deviceId/measurements
Content-Type: application/json

{ "query": "SELECT * FROM home WHERE time >= now() - INTERVAL '1 hour' ORDER BY time DESC" }
```

**Query Validation:**
- Must be a SELECT statement
- Max 2000 characters
- Blocked: DROP, DELETE, UPDATE, INSERT, ALTER, CREATE, TRUNCATE, GRANT, REVOKE, EXEC, EXECUTE, CALL
- No multi-statement queries (`;` followed by another statement)

**Response:** `200 OK` with `Content-Type: application/csv`
```csv
time,room,temp,humidity
2024-01-01T00:00:00Z,Kitchen,22.5,45.0
2024-01-01T00:01:00Z,Kitchen,22.6,44.8
```

**Errors:**
- `400` - Missing or invalid query
- `405` - Method not allowed (use POST)

## Error Responses

All errors return JSON:

```json
{
  "error": "Error message",
  "hint": "Optional helpful suggestion"
}
```

## Security Notes

- Device tokens are **never** returned in GET responses
- Tokens are only provided once during device creation
- All SQL queries are validated before execution
- DeviceId format is strictly validated to prevent injection
