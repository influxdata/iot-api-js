# Development Guide

## Prerequisites

- Node.js 18+ and Yarn
- Docker (for InfluxDB 3 Core)

## Quick Start

```bash
# 1. Start InfluxDB 3 Core
docker compose up -d influxdb3-core

# 2. Get the generated token
cat test/.influxdb3/core/.token

# 3. Configure environment
echo "INFLUX_TOKEN=$(cat test/.influxdb3/core/.token)" >> .env.local

# 4. Install and run
yarn
yarn dev -p 5200

# 5. Test the API
curl http://localhost:5200/api/devices
```

## Environment Variables

Copy `.env.development` to `.env.local` and customize:

```bash
INFLUX_HOST=http://localhost:8181
INFLUX_TOKEN=your-token
INFLUX_DATABASE=iot_center
INFLUX_DATABASE_AUTH=iot_center_devices
```

## Running Tests

```bash
# Run mocked unit tests (no database required)
yarn test

# Run with verbose output
yarn test --verbose
```

For integration testing with a live database, see [.claude/skills/run-tests/SKILL.md](../.claude/skills/run-tests/SKILL.md).

## Debugging

### Check InfluxDB 3 Logs

```bash
docker logs influxdb3-core
```

### Query Database Directly

```bash
TOKEN=$(cat test/.influxdb3/core/.token)

curl -X POST "http://localhost:8181/api/v3/query_sql" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"db": "iot_center", "q": "SELECT * FROM deviceauth"}'
```

### Health Check

```bash
curl http://localhost:8181/health
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Port 8181 in use | `docker compose down` then restart |
| 401 Unauthorized | Verify token in `.env.local` matches `test/.influxdb3/core/.token` |
| Database not found | Create databases via InfluxDB API (see skill docs) |
