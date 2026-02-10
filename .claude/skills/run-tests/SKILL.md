---
name: run-tests
description: Run API tests against InfluxDB 3 Core. Handles service initialization, database setup, and test execution.
author: InfluxData
version: "1.0"
---

# Run Tests Skill

## Purpose

This skill guides running the IoT API test suite against a local InfluxDB 3 Core instance. It covers service setup, database creation, and test execution.

## Quick Reference

| Task | Command |
|------|---------|
| Start InfluxDB 3 | `docker compose up -d influxdb3-core` |
| Check status | `curl -i http://localhost:8181/health` |
| Run tests | `yarn test` |
| View logs | `docker logs influxdb3-core` |

## Complete Setup Workflow

### 1. Initialize InfluxDB 3 Core

```bash
# Create required directories
mkdir -p test/.influxdb3/core/data test/.influxdb3/core/plugins

# Generate admin token (first time only)
openssl rand -hex 32 > test/.influxdb3/core/.token
chmod 600 test/.influxdb3/core/.token

# Start the container
docker compose up -d influxdb3-core

# Wait for healthy status
docker compose ps
```

### 2. Create Databases

```bash
# Get the token
TOKEN=$(cat test/.influxdb3/core/.token)

# Create main database
curl -X POST "http://localhost:8181/api/v3/configure/database" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"db": "iot_center"}'

# Create auth database
curl -X POST "http://localhost:8181/api/v3/configure/database" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"db": "iot_center_auth"}'

# Verify databases exist
curl "http://localhost:8181/api/v3/configure/database?format=json" \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Configure Environment

Create `.env.local` if it doesn't exist:

```bash
cat > .env.local << EOF
INFLUX_HOST=http://localhost:8181
INFLUX_TOKEN=$(cat test/.influxdb3/core/.token)
INFLUX_DATABASE=iot_center
INFLUX_DATABASE_AUTH=iot_center_auth
EOF
```

### 4. Run Tests

```bash
# Install dependencies (if needed)
yarn

# Run the test suite
yarn test

# Run with verbose output
yarn test --verbose

# Run specific test file
yarn test __tests__/api.test.js
```

## Troubleshooting

### Container Won't Start

**Symptom:** Container exits immediately

**Check:**
```bash
# View logs
docker logs influxdb3-core

# Verify directories exist
ls -la test/.influxdb3/core/

# Verify token file exists
cat test/.influxdb3/core/.token
```

**Common fixes:**
- Create missing directories: `mkdir -p test/.influxdb3/core/data test/.influxdb3/core/plugins`
- Generate token: `openssl rand -hex 32 > test/.influxdb3/core/.token`

### 401 Unauthorized

**Symptom:** API calls return 401

**Check:**
```bash
# Verify token matches
echo "Token in file: $(cat test/.influxdb3/core/.token)"
echo "Token in .env.local: $(grep INFLUX_TOKEN .env.local)"

# Test with token directly
curl -i http://localhost:8181/api/v3/configure/database \
  -H "Authorization: Bearer $(cat test/.influxdb3/core/.token)"
```

### Database Not Found

**Symptom:** Tests fail with "database not found"

**Fix:** Create the required databases:
```bash
TOKEN=$(cat test/.influxdb3/core/.token)
curl -X POST "http://localhost:8181/api/v3/configure/database" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"db": "iot_center"}'
curl -X POST "http://localhost:8181/api/v3/configure/database" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"db": "iot_center_auth"}'
```

### Port Already in Use

**Symptom:** "port is already allocated"

**Fix:**
```bash
# Find what's using the port
lsof -i :8181

# Stop existing container
docker compose down
```

## Clean Slate

To start fresh:

```bash
# Stop and remove containers
docker compose down

# Remove data (WARNING: deletes all data)
rm -rf test/.influxdb3/core/data/*

# Regenerate token
openssl rand -hex 32 > test/.influxdb3/core/.token

# Start fresh
docker compose up -d influxdb3-core
```

## Test Configuration

The test suite uses these environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `INFLUX_HOST` | `http://localhost:8181` | InfluxDB 3 API URL |
| `INFLUX_TOKEN` | (from `.env.local`) | Admin token |
| `INFLUX_DATABASE` | `iot_center` | Main data database |
| `INFLUX_DATABASE_AUTH` | `iot_center_auth` | Device auth database |

## Related Files

- **Docker Compose**: `compose.yaml`
- **Test suite**: `__tests__/api.test.js`
- **Environment defaults**: `.env.development`
- **Local overrides**: `.env.local` (gitignored)
