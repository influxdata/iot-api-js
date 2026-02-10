# IoT API JS - Claude Instructions

> **For Claude with MCP**
>
> This is a Next.js REST API server demonstrating InfluxDB 3 integration for IoT device data.
>
> **Instruction resources**:
> - [AGENTS.md](AGENTS.md) - For general AI assistants
> - [.github/INSTRUCTIONS.md](.github/INSTRUCTIONS.md) - Navigation guide
> - [.claude/](.claude/) - Claude configuration (settings, skills)

## Project Overview

This sample application demonstrates how to build an IoT data collection API using:
- **Next.js** - React framework for the API server
- **InfluxDB 3 Core** - Time-series database
- **@influxdata/influxdb3-client** - Official JavaScript client

## Quick Commands

| Task | Command |
|------|---------|
| Install dependencies | `yarn` |
| Start dev server | `yarn dev -p 5200` |
| Run tests | `yarn test` |
| Start InfluxDB 3 | `docker compose up -d influxdb3-core` |

## Project Structure

```
iot-api-js/
├── lib/
│   └── influxdb.js          # InfluxDB client helpers
├── pages/api/
│   ├── devices/             # Device CRUD endpoints
│   │   ├── create.js        # POST /api/devices/create
│   │   ├── _devices.js      # Shared device queries
│   │   └── [[...deviceParams]].js  # GET/DELETE /api/devices
│   └── measurements/        # Telemetry endpoints
│       └── index.js         # GET /api/measurements
├── __tests__/               # API tests
├── compose.yaml             # InfluxDB 3 Core container
└── .env.development         # Default config (committed)
```

## Environment Configuration

Copy `.env.development` values to `.env.local` and customize:

```bash
INFLUX_HOST=http://localhost:8181
INFLUX_TOKEN=your-token
INFLUX_DATABASE=iot_center
INFLUX_DATABASE_AUTH=iot_center_devices
```

## Testing

Run the test suite against a local InfluxDB 3 Core instance:

```bash
# Start InfluxDB 3 Core
docker compose up -d influxdb3-core

# Run tests
yarn test
```

See `.claude/skills/run-tests/SKILL.md` for detailed testing workflow.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/devices` | GET | List all devices |
| `/api/devices/:id` | GET | Get device by ID |
| `/api/devices/create` | POST | Create new device |
| `/api/devices/:id` | DELETE | Delete device |
| `/api/measurements` | GET | Query device telemetry |

## Key Patterns

### InfluxDB 3 Client Usage

```javascript
import { createClient, query, write } from '../../../lib/influxdb'

// Query with SQL
const results = await query('SELECT * FROM deviceauth', database)

// Write line protocol
await write('measurement,tag=value field=1', database)
```

### Application-Level Tokens

This app uses application-managed tokens stored in the database (not InfluxDB-native auth tokens). Tokens are:
- Generated via `generateDeviceToken()` in `lib/influxdb.js`
- Stored in the `deviceauth` measurement
- Never exposed via public API responses
