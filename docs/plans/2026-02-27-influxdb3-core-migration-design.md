# InfluxDB 3 Core Migration Design

Standalone demo app for InfluxDB 3 Core (with optional Enterprise support),
used as a tutorial reference on the InfluxData documentation site.

## Architecture

```
┌─────────────────┐     ┌──────────────────────────────┐     ┌──────────────────────┐
│   Frontend UI   │────>│     Next.js API (this repo)  │────>│   InfluxDB 3 Core    │
│  (iot-api-ui)   │     │                              │     │   or Enterprise      │
└─────────────────┘     │  pages/api/                  │     │                      │
                        │  ├── devices/create.js       │     │  Databases:          │
                        │  ├── devices/[[...params]].js│     │  ├── iot_center      │
                        │  └── devices/:id/status [NEW]│     │  └── iot_center_devices
                        │                              │     │                      │
                        │  lib/                        │     │  Caches:             │
                        │  ├── influxdb.js (existing)  │     │  ├── LVC: deviceStatus
                        │  └── enterprise.js [NEW]     │     │  └── DVC: deviceList │
                        └──────────────────────────────┘     │                      │
                                                             │  Plugins:            │
                                                             │  └── sensor_guard.py │
                                                             └──────────────────────┘
```

### What stays the same

- Two databases: `iot_center` (telemetry), `iot_center_devices` (device auth)
- `lib/influxdb.js` as the client factory with `query()`, `write()`, `Point`
- Existing API routes for device CRUD and measurements
- Pages Router, Jest tests, Docker Compose

### What's new

- LVC on `iot_center` for fast device status queries
- DVC on `iot_center_devices` for fast device enumeration
- Processing Engine plugin (Python) for data validation on write
- `lib/enterprise.js` for Enterprise-only features
- New API path for device status via LVC
- Enterprise service in compose.yaml (Docker profile-gated)

### Technology

| Component | Technology |
|-----------|------------|
| API Framework | Next.js 16 (Pages Router) |
| Database | InfluxDB 3 Core / Enterprise |
| Client Library | @influxdata/influxdb3-client v2.x |
| Testing | Jest with mocks |
| Plugin Runtime | Python (Processing Engine) |

## Caching

### Last Value Cache (LVC) — Device Status

Caches the most recent sensor reading per device for sub-10ms dashboard queries.

**Setup (manual CLI):**

```sh
influxdb3 create last_cache \
  --database iot_center \
  --table sensor_data \
  --key-columns deviceId \
  --value-columns temperature,humidity,pressure \
  --count 1 \
  --ttl 30mins \
  --token $TOKEN \
  deviceStatus
```

**Query pattern:**

```sql
SELECT * FROM last_cache('sensor_data', 'deviceStatus')
WHERE deviceId = '...'
```

### Distinct Value Cache (DVC) — Device Listing

Caches distinct `deviceId` values for sub-30ms device enumeration.

**Setup (manual CLI):**

```sh
influxdb3 create distinct_cache \
  --database iot_center_devices \
  --table deviceauth \
  --columns deviceId \
  --max-cardinality 10000 \
  --max-age 24h \
  --token $TOKEN \
  deviceList
```

**Query pattern:**

```sql
SELECT * FROM distinct_cache('deviceauth', 'deviceList')
```

### Graceful degradation

Both cache queries catch errors and fall back to regular SQL. The app works
without caches configured -- they are a performance optimization, not a
requirement. Tutorial flow: "it works without caches, now let's make it fast."

## Processing Engine Plugin

### Trigger type: WAL flush

A WAL flush trigger fires when sensor data is written. This is the most natural
fit for an IoT pipeline -- validate and enrich data inline without external
services.

### Plugin: `sensor_guard.py`

Validates incoming sensor data on write:

- Receives batches of written rows from the `sensor_data` table
- Validates ranges (temperature -50 to 150, humidity 0 to 100)
- Writes out-of-range readings to a `sensor_alerts` table with original values
  plus an `alert_type` tag
- Logs warnings for rejected data

```python
def process_writes(influxdb3_local, table_batches, args=None):
    for table_batch in table_batches:
        if table_batch["table_name"] != "sensor_data":
            continue
        for row in table_batch["rows"]:
            device_id = row.get("deviceId", "unknown")
            temp = row.get("temperature")
            humidity = row.get("humidity")

            alerts = []
            if temp is not None and not (-50 <= temp <= 150):
                alerts.append("temperature_out_of_range")
            if humidity is not None and not (0 <= humidity <= 100):
                alerts.append("humidity_out_of_range")

            for alert_type in alerts:
                line = (
                    f'sensor_alerts,deviceId={device_id},'
                    f'alert_type={alert_type} '
                    f'temperature={temp},humidity={humidity}'
                )
                influxdb3_local.write(line)
                influxdb3_local.info(
                    f"Alert: {alert_type} for device {device_id}"
                )
```

**Trigger setup (manual CLI):**

```sh
influxdb3 create trigger \
  --database iot_center \
  --plugin sensor_guard.py \
  --trigger-spec "table:sensor_data" \
  --token $TOKEN \
  sensorGuardTrigger
```

### Why not other trigger types?

- **Scheduled**: Could work for deadman alerting, but adds complexity without
  teaching much beyond what WAL flush shows. Possible follow-up.
- **HTTP request**: The app already has Next.js API routes. A competing HTTP
  endpoint inside InfluxDB would confuse the tutorial.

## Enterprise Support

### Configuration

Environment variable `INFLUX_EDITION` controls which edition the app targets.
Defaults to `core`.

### `lib/enterprise.js`

Provides three Enterprise-specific features:

1. **Fine-grained database tokens**: Enterprise supports read/write tokens
   scoped to specific databases. Instead of application-level tokens stored in
   `deviceauth`, Enterprise issues real database tokens per device.

2. **Table-level retention**: Enterprise supports per-table retention periods.
   Exposes a helper to set retention on `sensor_data` independently from the
   database default.

3. **Historical queries**: Core limits queries to recent data (~72 hours
   uncompacted). Enterprise compacts data and enables historical range queries.
   Provides a helper that removes the time-range guardrails.

### Integration pattern

Existing routes gain small conditional branches:

```javascript
if (config.edition === 'enterprise') {
  const { createDatabaseToken } = await import('../../../lib/enterprise.js')
  // Enterprise token creation
} else {
  // Core: generate app-level token
}
```

### Docker Compose

Enterprise service behind a profile (does not start by default):

```yaml
influxdb3-enterprise:
  container_name: influxdb3-enterprise
  image: influxdb:3-enterprise
  profiles: ["enterprise"]
  ports:
    - 8181:8181
```

Users run `docker compose --profile enterprise up -d` to use Enterprise.

### What Enterprise does NOT change

- Same database names, table schemas, API routes
- Same LVC and DVC (both work on Enterprise)
- Same Processing Engine plugins (same API)
- Tutorial flow: "build with Core first, then here's what Enterprise adds"

## Data Flow

### Route Map

| Method | Route | Behavior | New? |
|--------|-------|----------|------|
| POST | `/api/devices/create` | Register device, generate token | Enterprise: database tokens |
| GET | `/api/devices` | List all devices | DVC fast path |
| GET | `/api/devices/:deviceId` | Get specific device | No change |
| GET | `/api/devices/:deviceId/status` | Latest readings | NEW (LVC) |
| POST | `/api/devices/:deviceId/measurements` | Query sensor data | Enterprise: no time limit |

### Write flow (with Processing Engine)

```
Client writes sensor data
       |
       v
POST /api/devices/:deviceId/measurements
       |
       v
lib/influxdb.js write() --> InfluxDB 3
       |
       v
WAL flush triggers sensor_guard.py
       |
       |-- Valid data --> stored in sensor_data
       |                  LVC updated automatically
       |
       +-- Out-of-range --> alert written to sensor_alerts
```

### Read flow (with caches)

```
GET /api/devices
       |
       v
_devices.js --> distinct_cache('deviceauth', 'deviceList')
       |            <30ms response
       v
Return device list


GET /api/devices/:deviceId/status
       |
       v
[[...deviceParams]].js --> last_cache('sensor_data', 'deviceStatus')
       |                       <10ms response
       v
Return latest readings
```

## File Changes

### New files

| File | Purpose |
|------|---------|
| `lib/enterprise.js` | Enterprise-only helpers |
| `plugins/sensor_guard.py` | WAL flush plugin for sensor validation |

### Modified files

| File | Changes |
|------|---------|
| `lib/influxdb.js` | Add `config.edition` getter |
| `pages/api/devices/[[...deviceParams]].js` | Add `status` path, Enterprise conditional |
| `pages/api/devices/_devices.js` | DVC fast path with fallback |
| `pages/api/devices/create.js` | Enterprise conditional for database tokens |
| `compose.yaml` | Add Enterprise service behind profile |
| `.env.development` | Add `INFLUX_EDITION=core` |
| `__tests__/api.test.js` | Tests for status endpoint, cache fallback |
| `docs/architecture.md` | Update with caching, plugins, Enterprise |
| `README.md` | Setup steps for caches, plugin, Enterprise |

### Unchanged files

| File | Why |
|------|-----|
| `pages/api/measurements/index.js` | Shared query helper, no changes |
| `package.json` | No new dependencies |
| `jest.config.js` | Test config stays the same |

### Scope

- 2 new files
- ~8 modified files
- 0 new npm dependencies
- 1 Python file (plugin, not a Node dependency)

## Testing

### Jest tests (mock-based)

**Status endpoint (LVC):**
- Returns latest reading from LVC
- Returns null when no readings exist
- Falls back to regular query on cache error
- Returns 405 for non-GET methods

**Device listing (DVC):**
- Uses DVC when available
- Falls back to full table scan on cache error
- Results match same shape regardless of code path

**Enterprise conditionals:**
- `INFLUX_EDITION=enterprise` triggers database token flow
- `INFLUX_EDITION=core` (default) uses app-level token logic

### Plugin testing (manual)

The Processing Engine plugin runs inside InfluxDB, not in Node.js.
Manual verification documented in README:

1. Write an out-of-range sensor value
2. Query `sensor_alerts` to confirm the alert appeared

### Error handling

**Cache unavailable:** Catch, log warning, fall back to standard SQL.

**Plugin failures:** Logged server-side by Processing Engine. Do not block
writes. No app-side handling needed.

**Enterprise on Core:** If `INFLUX_EDITION=enterprise` but server is Core,
Enterprise API calls return clear HTTP errors (401/404). App passes these
through with context message.
