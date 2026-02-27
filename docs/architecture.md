# Architecture

## System Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend UI   │────▶│  Next.js API    │────▶│  InfluxDB 3     │
│  (iot-api-ui)   │     │   (this repo)   │     │     Core        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

This sample application demonstrates building REST APIs with InfluxDB 3 Core for IoT data collection.

## Project Structure

```
iot-api-js/
├── lib/
│   └── influxdb.js              # InfluxDB client factory and helpers
├── pages/api/
│   ├── devices/
│   │   ├── create.js            # POST /api/devices/create
│   │   ├── _devices.js          # Shared device query logic
│   │   └── [[...deviceParams]].js  # GET /api/devices, POST measurements
│   └── measurements/
│       └── index.js             # Shared query function (not a route)
├── __tests__/
│   └── api.test.js              # API integration tests
├── docs/                        # Documentation
├── .claude/                     # Claude Code configuration
│   ├── settings.json
│   └── skills/
├── compose.yaml                 # InfluxDB 3 Core container
├── .env.development             # Default config (committed)
└── .env.local                   # Local overrides (gitignored)
```

## Databases

The application uses two InfluxDB databases:

| Database | Purpose | Measurements |
|----------|---------|--------------|
| `iot_center` | Device telemetry data | Custom per device |
| `iot_center_devices` | Device registration | `deviceauth` |

### Device Auth Schema

The `deviceauth` measurement stores device credentials:

| Field | Type | Description |
|-------|------|-------------|
| `time` | timestamp | Registration time |
| `deviceId` | tag | Unique device identifier |
| `key` | field (string) | Device key |
| `token` | field (string) | Application-level auth token |

## Technology Stack

| Component | Technology |
|-----------|------------|
| API Framework | Next.js 16 (Pages Router) |
| Database | InfluxDB 3 Core |
| Client Library | @influxdata/influxdb3-client |
| Testing | Jest with mocks |
