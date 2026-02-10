# IoT API JS - AI Assistant Guide

> **For general AI assistants (Claude, ChatGPT, Gemini, etc.)**
>
> This guide provides instructions for AI assistants helping with the IoT API sample application.
>
> **Other instruction resources**:
> - [CLAUDE.md](CLAUDE.md) - For Claude with MCP
> - [.github/INSTRUCTIONS.md](.github/INSTRUCTIONS.md) - Navigation guide
> - [README.md](README.md) - User-facing documentation

## Project Purpose

This is a **sample application** for InfluxData documentation tutorials. It demonstrates:
- Building REST APIs that interact with InfluxDB 3
- Device registration with application-level authentication
- Writing and querying time-series IoT data
- Using the `@influxdata/influxdb3-client` JavaScript library

**Target audience**: Developers learning to build IoT applications with InfluxDB 3.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend UI   │────▶│  Next.js API    │────▶│  InfluxDB 3     │
│  (iot-api-ui)   │     │   (this repo)   │     │     Core        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │
                              ▼
                        ┌─────────────────────┐
                        │  Two databases:     │
                        │  - iot_center       │
                        │ - iot_center        │
                        │ - iot_center_devices│
                        └─────────────────────┘
```

## Key Files

| File | Purpose |
|------|---------|
| `lib/influxdb.js` | InfluxDB client factory and helpers |
| `pages/api/devices/create.js` | Device registration endpoint |
| `pages/api/devices/_devices.js` | Shared device query logic |
| `pages/api/devices/[[...deviceParams]].js` | Device CRUD operations |
| `pages/api/measurements/index.js` | Telemetry query endpoint |
| `__tests__/api.test.js` | API integration tests |

## Development Workflow

### Prerequisites

1. Node.js 18+ and Yarn
2. Docker (for InfluxDB 3 Core)
3. Environment variables in `.env.local`

### Local Development

```bash
# 1. Start InfluxDB 3 Core
docker compose up -d influxdb3-core

# 2. Get the generated token
cat test/.influxdb3/core/.token

# 3. Configure .env.local with the token
echo "INFLUX_TOKEN=$(cat test/.influxdb3/core/.token)" >> .env.local

# 4. Install dependencies and start
yarn
yarn dev -p 5200

# 5. Test the API
curl http://localhost:5200/api/devices
```

### Running Tests

```bash
# Ensure InfluxDB 3 is running
docker compose up -d influxdb3-core

# Run test suite
yarn test
```

## Code Patterns

Use SQL or InfluxQL to query data.

### SQL Queries (InfluxDB 3)

Query InfluxDB 3 using SQL:

```javascript
// Query devices
const sql = `
  SELECT time, deviceId, key
  FROM deviceauth
  WHERE deviceId = '${escapeString(deviceId)}'
  ORDER BY time DESC
  LIMIT 1
`
const rows = await query(sql, database)
```

### Writing Data with Points

```javascript
import { Point } from '@influxdata/influxdb3-client'

const point = Point.measurement('deviceauth')
  .setTag('deviceId', deviceId)
  .setStringField('key', deviceKey)
  .setStringField('token', deviceToken)

await write(point.toLineProtocol(), database)
```

### Client Lifecycle

Always close clients after use:

```javascript
const client = createClient()
try {
  // Use client...
} finally {
  await client.close()
}
```

## Common Tasks

### Adding a New Endpoint

1. Create file in `pages/api/` following Next.js conventions
2. Import helpers from `lib/influxdb.js`
3. Add input validation (see `DEVICE_ID_PATTERN` example)
4. Add tests in `__tests__/`

### Modifying Database Schema

Data is stored as time-series measurements:
- `deviceauth` - Device registration (tags: deviceId; fields: key, token)
- Custom measurements for telemetry

### Debugging

```bash
# Check InfluxDB 3 logs
docker logs influxdb3-core

# Query directly with curl
curl -X POST "http://localhost:8181/api/v3/query_sql" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"db": "iot_center", "q": "SELECT * FROM deviceauth"}'
```

## Style Guidelines

- Use ES modules (`import`/`export`)
- Validate all user input before database operations
- Never expose tokens in API responses
- Use descriptive error messages
- Follow existing patterns in the codebase

## Related Resources

- [InfluxDB 3 Core Documentation](https://docs.influxdata.com/influxdb3/core/)
- [influxdb3-javascript Client](https://github.com/InfluxCommunity/influxdb3-js)
- [IoT Starter Tutorial](https://docs.influxdata.com/influxdb/v2/api-guide/tutorials/nodejs/)
- [iot-api-ui Frontend](https://github.com/influxdata/iot-api-ui)
