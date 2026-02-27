# InfluxDB 3 Core Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add LVC/DVC caching, a Processing Engine plugin, and optional Enterprise support to the existing InfluxDB 3 Core demo app.

**Architecture:** Incremental enhancement of the existing Next.js Pages Router app. New features are additive — a new `/status` API path, DVC fast-path in device listing, a Python plugin file, and a separate Enterprise module. Cache queries degrade gracefully to standard SQL.

**Tech Stack:** Next.js 16 (Pages Router), @influxdata/influxdb3-client v2.x, Jest, Python (Processing Engine plugin)

---

### Task 1: Add `edition` to config

Add the `INFLUX_EDITION` getter to the shared config object so all modules can check which edition is active.

**Files:**
- Modify: `lib/influxdb.js:23-36`
- Test: `__tests__/api.test.js:13-30` (update mock)

**Step 1: Update the mock in the test file**

In `__tests__/api.test.js`, add `edition` to the mocked config object:

```javascript
jest.mock('../lib/influxdb', () => ({
  query: jest.fn(),
  write: jest.fn(),
  config: {
    host: 'http://localhost:8181',
    token: 'test-token',
    database: 'iot_center',
    databaseAuth: 'iot_center_devices',
    edition: 'core',
  },
  generateDeviceToken: jest.fn(() => 'iot_mock_token_12345'),
  Point: {
    measurement: jest.fn(() => ({
      setTag: jest.fn().mockReturnThis(),
      setStringField: jest.fn().mockReturnThis(),
      toLineProtocol: jest.fn(() => 'deviceauth,deviceId=test-device key="test-key",token="test-token"'),
    })),
  },
}))
```

**Step 2: Run tests to verify nothing broke**

Run: `yarn test`
Expected: All existing tests pass (the new `edition` field is additive)

**Step 3: Add the `edition` getter to `lib/influxdb.js`**

Add after the `databaseAuth` getter at line 35:

```javascript
  get edition() {
    return process.env.INFLUX_EDITION || 'core'
  },
```

The full config object becomes:

```javascript
export const config = {
  get host() {
    return process.env.INFLUX_HOST
  },
  get token() {
    return process.env.INFLUX_TOKEN
  },
  get database() {
    return process.env.INFLUX_DATABASE
  },
  get databaseAuth() {
    return process.env.INFLUX_DATABASE_AUTH
  },
  get edition() {
    return process.env.INFLUX_EDITION || 'core'
  },
}
```

**Step 4: Run tests to verify**

Run: `yarn test`
Expected: All tests pass

**Step 5: Commit**

```bash
git add lib/influxdb.js __tests__/api.test.js
git commit -m "feat: add edition getter to influxdb config"
```

---

### Task 2: DVC fast path for device listing

Add distinct value cache query to `getDevices()` with graceful fallback.

**Files:**
- Modify: `pages/api/devices/_devices.js`
- Test: `__tests__/api.test.js`

**Step 1: Write the failing test for DVC fast path**

Add to `__tests__/api.test.js` after the existing `GET /api/devices` describe block:

```javascript
describe('GET /api/devices (DVC fast path)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('falls back to full query when DVC query fails', async () => {
    // First call: DVC query fails (cache not configured)
    // Second call: fallback full query succeeds
    query
      .mockRejectedValueOnce(new Error('cache not found'))
      .mockResolvedValueOnce([
        { deviceId: 'device-1', key: 'key-1', time: new Date() },
      ])

    const { req, res } = createMocks({
      method: 'GET',
      query: { deviceParams: [] },
    })

    await devicesHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data).toHaveLength(1)
    expect(data[0].deviceId).toBe('device-1')
    // query was called twice: DVC attempt + fallback
    expect(query).toHaveBeenCalledTimes(2)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `yarn test`
Expected: FAIL — the current `getDevices()` calls `query` only once, so `toHaveBeenCalledTimes(2)` fails.

**Step 3: Implement DVC fast path in `_devices.js`**

Replace the `else` branch (list all devices) in `getDevices()`. The full function becomes:

```javascript
export async function getDevices(deviceId, options = {}) {
  const { includeToken = false } = options
  const database = config.databaseAuth

  let rows

  if (deviceId !== undefined) {
    const tokenField = includeToken ? ', token' : ''
    const sql = `
      SELECT time, deviceId, key${tokenField}
      FROM deviceauth
      WHERE deviceId = '${escapeString(deviceId)}'
      ORDER BY time DESC
      LIMIT 1
    `
    rows = await query(sql, database)
  } else {
    // Try DVC for fast device enumeration, fall back to full scan
    rows = await queryDevicesDvc(database)
  }

  const devices = {}

  for (const row of rows) {
    const id = row.deviceId
    if (!id) {
      continue
    }

    if (devices[id]) {
      const existingTime = new Date(devices[id].updatedAt).getTime()
      const rowTime = new Date(row.time).getTime()
      if (rowTime <= existingTime) {
        continue
      }
    }

    devices[id] = {
      deviceId: id,
      key: row.key,
      updatedAt: row.time,
    }

    if (includeToken && row.token) {
      devices[id].token = row.token
    }
  }

  return devices
}

/**
 * Queries devices using the Distinct Value Cache for fast enumeration.
 * Falls back to a full table scan if the DVC is not configured.
 */
async function queryDevicesDvc(database) {
  try {
    return await query(
      "SELECT * FROM distinct_cache('deviceauth', 'deviceList')",
      database
    )
  } catch {
    console.warn('DVC not available, falling back to full device query')
    return await query(
      'SELECT time, deviceId, key FROM deviceauth ORDER BY time DESC',
      database
    )
  }
}
```

**Step 4: Run tests to verify**

Run: `yarn test`
Expected: All tests pass, including the new DVC fallback test

**Step 5: Commit**

```bash
git add pages/api/devices/_devices.js __tests__/api.test.js
git commit -m "feat: add DVC fast path for device listing with fallback"
```

---

### Task 3: LVC device status endpoint

Add `GET /api/devices/:deviceId/status` that queries the Last Value Cache.

**Files:**
- Modify: `pages/api/devices/[[...deviceParams]].js`
- Test: `__tests__/api.test.js`

**Step 1: Write the failing tests**

Add to `__tests__/api.test.js`:

```javascript
describe('GET /api/devices/:deviceId/status', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns latest reading from LVC', async () => {
    query.mockResolvedValue([
      { deviceId: 'sensor-001', temperature: 22.5, humidity: 45.0, time: '2026-02-27T10:00:00Z' },
    ])

    const { req, res } = createMocks({
      method: 'GET',
      query: { deviceParams: ['sensor-001', 'status'] },
    })

    await devicesHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.deviceId).toBe('sensor-001')
    expect(data.temperature).toBe(22.5)
  })

  test('returns null when no readings exist', async () => {
    query.mockResolvedValue([])

    const { req, res } = createMocks({
      method: 'GET',
      query: { deviceParams: ['sensor-999', 'status'] },
    })

    await devicesHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data).toBeNull()
  })

  test('falls back to regular query when LVC fails', async () => {
    query
      .mockRejectedValueOnce(new Error('cache not found'))
      .mockResolvedValueOnce([
        { deviceId: 'sensor-001', temperature: 22.5, humidity: 45.0, time: '2026-02-27T10:00:00Z' },
      ])

    const { req, res } = createMocks({
      method: 'GET',
      query: { deviceParams: ['sensor-001', 'status'] },
    })

    await devicesHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    expect(query).toHaveBeenCalledTimes(2)
  })

  test('rejects non-GET methods', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      query: { deviceParams: ['sensor-001', 'status'] },
    })

    await devicesHandler(req, res)

    expect(res._getStatusCode()).toBe(405)
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `yarn test`
Expected: FAIL — `status` path is not handled yet, so requests fall through to the device listing handler.

**Step 3: Add status handler to `[[...deviceParams]].js`**

Add this block after the `deviceId` / `path` parsing (after line 64), before the measurements handler:

```javascript
    // Handle device status: GET /api/devices/:deviceId/status
    if (Array.isArray(path) && path[0] === 'status') {
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed. Use GET for device status.' })
      }
      const data = await getDeviceStatus(deviceId)
      return res.status(200).json(data)
    }
```

Add the imports at the top of the file. Update the existing import line:

```javascript
import { query, config } from '../../../lib/influxdb'
```

Add the `getDeviceStatus` function at the bottom of the file (before the closing):

```javascript
/**
 * Gets the latest sensor readings for a device using the Last Value Cache.
 * Falls back to a regular query if the LVC is not configured.
 *
 * @param {string} deviceId - The device to get status for
 * @returns {Promise<Object|null>} Latest readings or null
 */
async function getDeviceStatus(deviceId) {
  const escaped = deviceId.replace(/'/g, "''")
  try {
    const rows = await query(
      `SELECT * FROM last_cache('sensor_data', 'deviceStatus') WHERE deviceId = '${escaped}'`,
      config.database
    )
    return rows[0] || null
  } catch {
    console.warn('LVC not available, falling back to regular query')
    const rows = await query(
      `SELECT * FROM sensor_data WHERE deviceId = '${escaped}' ORDER BY time DESC LIMIT 1`,
      config.database
    )
    return rows[0] || null
  }
}
```

The full imports at the top of the file become:

```javascript
import { getMeasurements } from '../measurements'
import { getDevices } from './_devices'
import { query, config } from '../../../lib/influxdb'
```

**Step 4: Run tests to verify**

Run: `yarn test`
Expected: All tests pass

**Step 5: Commit**

```bash
git add pages/api/devices/[[...deviceParams]].js __tests__/api.test.js
git commit -m "feat: add device status endpoint with LVC and fallback"
```

---

### Task 4: Processing Engine plugin

Create the `sensor_guard.py` WAL flush plugin.

**Files:**
- Create: `plugins/sensor_guard.py`

**Step 1: Create the plugins directory**

```bash
mkdir -p plugins
```

**Step 2: Write the plugin**

Create `plugins/sensor_guard.py`:

```python
"""
Sensor Guard Plugin — validates incoming sensor data on WAL flush.

Trigger type: WAL flush (table:sensor_data)
Database: iot_center

Checks temperature and humidity ranges. Out-of-range readings are written
to the sensor_alerts table with the original values and an alert_type tag.

Setup:
  influxdb3 create trigger \
    --database iot_center \
    --plugin sensor_guard.py \
    --trigger-spec "table:sensor_data" \
    --token $TOKEN \
    sensorGuardTrigger
"""

TEMP_MIN = -50
TEMP_MAX = 150
HUMIDITY_MIN = 0
HUMIDITY_MAX = 100


def process_writes(influxdb3_local, table_batches, args=None):
    for table_batch in table_batches:
        if table_batch["table_name"] != "sensor_data":
            continue

        for row in table_batch["rows"]:
            device_id = row.get("deviceId", "unknown")
            temp = row.get("temperature")
            humidity = row.get("humidity")

            alerts = []
            if temp is not None and not (TEMP_MIN <= temp <= TEMP_MAX):
                alerts.append("temperature_out_of_range")
            if humidity is not None and not (HUMIDITY_MIN <= humidity <= HUMIDITY_MAX):
                alerts.append("humidity_out_of_range")

            for alert_type in alerts:
                line = (
                    f"sensor_alerts,deviceId={device_id},"
                    f"alert_type={alert_type} "
                    f"temperature={temp},humidity={humidity}"
                )
                influxdb3_local.write(line)
                influxdb3_local.info(
                    f"Alert: {alert_type} for device {device_id}"
                )
```

**Step 3: Commit**

```bash
git add plugins/sensor_guard.py
git commit -m "feat: add sensor_guard Processing Engine plugin"
```

---

### Task 5: Enterprise module

Create `lib/enterprise.js` with Enterprise-specific helpers.

**Files:**
- Create: `lib/enterprise.js`
- Test: `__tests__/api.test.js`

**Step 1: Write the failing test**

Add to `__tests__/api.test.js`:

```javascript
describe('Enterprise module', () => {
  test('exports expected functions', async () => {
    const enterprise = await import('../lib/enterprise')
    expect(typeof enterprise.createDatabaseToken).toBe('function')
    expect(typeof enterprise.setTableRetention).toBe('function')
    expect(typeof enterprise.isEnterprise).toBe('function')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `yarn test`
Expected: FAIL — `lib/enterprise` does not exist

**Step 3: Create `lib/enterprise.js`**

```javascript
import { config } from './influxdb'

/**
 * Checks if the app is configured for InfluxDB 3 Enterprise.
 * @returns {boolean}
 */
export function isEnterprise() {
  return config.edition === 'enterprise'
}

/**
 * Creates a fine-grained database token via the Enterprise API.
 * Enterprise supports read/write tokens scoped to specific databases.
 *
 * @param {string} description - Token description
 * @param {string} database - Database to scope the token to
 * @param {string[]} permissions - Permissions array, e.g. ['read', 'write']
 * @returns {Promise<{id: string, token: string}>}
 */
export async function createDatabaseToken(description, database, permissions) {
  const res = await fetch(`${config.host}/api/v3/configure/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description,
      permissions: permissions.map((p) => ({
        resource_type: 'database',
        resource_name: database,
        action: p,
      })),
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Failed to create database token: ${res.status} ${body}`)
  }

  return res.json()
}

/**
 * Sets a retention period on a specific table (Enterprise only).
 * Core only supports database-level retention.
 *
 * @param {string} database - Database name
 * @param {string} table - Table name
 * @param {string} retention - Retention period, e.g. '30d', '24h'
 */
export async function setTableRetention(database, table, retention) {
  const res = await fetch(
    `${config.host}/api/v3/configure/table/retention_period`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ db: database, table, retention_period: retention }),
    }
  )

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Failed to set table retention: ${res.status} ${body}`)
  }
}
```

**Step 4: Run tests to verify**

Run: `yarn test`
Expected: All tests pass

**Step 5: Commit**

```bash
git add lib/enterprise.js __tests__/api.test.js
git commit -m "feat: add Enterprise module with token and retention helpers"
```

---

### Task 6: Enterprise conditional in device creation

Wire the Enterprise database token flow into `create.js`.

**Files:**
- Modify: `pages/api/devices/create.js`
- Test: `__tests__/api.test.js`

**Step 1: Write the failing test**

Add to `__tests__/api.test.js`:

```javascript
describe('POST /api/devices/create (Enterprise)', () => {
  const originalEdition = process.env.INFLUX_EDITION

  afterEach(() => {
    process.env.INFLUX_EDITION = originalEdition || ''
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  test('uses app-level token on Core (default)', async () => {
    process.env.INFLUX_EDITION = 'core'
    query.mockResolvedValue([])
    write.mockResolvedValue(undefined)

    const { req, res } = createMocks({
      method: 'POST',
      body: { deviceId: 'core-device' },
    })

    await createHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    // Core uses app-level token (starts with iot_)
    expect(data.token).toMatch(/^iot_/)
  })
})
```

**Step 2: Run test to verify it passes**

Run: `yarn test`
Expected: PASS — this test documents existing Core behavior. It should already pass before any changes.

**Step 3: Update `create.js` with Enterprise conditional**

Modify the `createDevice` function in `pages/api/devices/create.js`. Add `config` to the import (it's already imported). Add the Enterprise branch:

```javascript
async function createDevice(deviceId) {
  const existingDevices = await getDevices(deviceId)
  const existingDevice = Object.values(existingDevices)[0]

  if (existingDevice?.key) {
    throw new Error('This device ID is already registered and has an authorization.')
  }

  console.log(`createDevice: deviceId=${deviceId}`)

  if (config.edition === 'enterprise') {
    // Enterprise: create a fine-grained database token via the API
    const { createDatabaseToken } = await import('../../../lib/enterprise.js')
    const tokenResult = await createDatabaseToken(
      `Device token for ${deviceId}`,
      config.database,
      ['read', 'write']
    )

    const point = Point.measurement('deviceauth')
      .setTag('deviceId', deviceId)
      .setStringField('key', tokenResult.id)
      .setStringField('token', tokenResult.token)

    await write(point.toLineProtocol(), config.databaseAuth)

    console.log(`Device created (Enterprise): ${deviceId}`)

    return {
      deviceId,
      key: tokenResult.id,
      token: tokenResult.token,
      database: config.database,
      host: config.host,
      message: 'Device registered with Enterprise database token.',
    }
  }

  // Core: generate application-level token
  const deviceToken = generateDeviceToken()
  const deviceKey = `device_${deviceId}_${Date.now()}`

  const point = Point.measurement('deviceauth')
    .setTag('deviceId', deviceId)
    .setStringField('key', deviceKey)
    .setStringField('token', deviceToken)

  await write(point.toLineProtocol(), config.databaseAuth)

  console.log(`Device created: ${deviceId}`)

  return {
    deviceId,
    key: deviceKey,
    token: deviceToken,
    database: config.database,
    host: config.host,
    message: 'Device registered successfully. Use the provided token for device authentication.',
  }
}
```

**Step 4: Run tests to verify**

Run: `yarn test`
Expected: All tests pass

**Step 5: Commit**

```bash
git add pages/api/devices/create.js __tests__/api.test.js
git commit -m "feat: add Enterprise database token flow to device creation"
```

---

### Task 7: Enterprise service in Docker Compose

Add the Enterprise service behind a Docker Compose profile.

**Files:**
- Modify: `compose.yaml`

**Step 1: Add Enterprise service and secrets**

Append to `compose.yaml` after the Core service, and add the Enterprise secret to the `secrets` section:

Add to `secrets:` section:

```yaml
  influxdb3-enterprise-token:
    file: test/.influxdb3/enterprise/.token
```

Add new service after the `influxdb3-core` service:

```yaml
  # ============================================================================
  # InfluxDB 3 Enterprise (optional)
  # ============================================================================
  # Commercial edition with compaction, historical queries, and fine-grained
  # tokens. Only starts when the 'enterprise' profile is active.
  #
  # USAGE:
  #   docker compose --profile enterprise up -d influxdb3-enterprise
  #
  # FIRST-TIME SETUP:
  #   1. Create directories:
  #      mkdir -p test/.influxdb3/enterprise/data test/.influxdb3/enterprise/plugins
  #
  #   2. Generate token:
  #      openssl rand -hex 32 > test/.influxdb3/enterprise/.token
  #      chmod 600 test/.influxdb3/enterprise/.token
  #
  #   3. Start service:
  #      docker compose --profile enterprise up -d influxdb3-enterprise
  #
  #   4. Create databases (same as Core):
  #      TOKEN=$(cat test/.influxdb3/enterprise/.token)
  #      curl -X POST "http://localhost:8181/api/v3/configure/database" \
  #        -H "Authorization: Bearer $TOKEN" \
  #        -H "Content-Type: application/json" \
  #        -d '{"db": "iot_center"}'
  #      curl -X POST "http://localhost:8181/api/v3/configure/database" \
  #        -H "Authorization: Bearer $TOKEN" \
  #        -H "Content-Type: application/json" \
  #        -d '{"db": "iot_center_devices"}'
  # ============================================================================
  influxdb3-enterprise:
    container_name: influxdb3-enterprise
    image: influxdb:3-enterprise
    profiles: ["enterprise"]
    pull_policy: always
    ports:
      - 8181:8181
    command:
      - influxdb3
      - serve
      - --node-id=node0
      - --object-store=file
      - --data-dir=/var/lib/influxdb3/data
      - --plugin-dir=/var/lib/influxdb3/plugins
      - --admin-token-file=/run/secrets/influxdb3-enterprise-token
      - --log-filter=info
    volumes:
      - type: bind
        source: test/.influxdb3/enterprise/data
        target: /var/lib/influxdb3/data
      - type: bind
        source: test/.influxdb3/enterprise/plugins
        target: /var/lib/influxdb3/plugins
    secrets:
      - influxdb3-enterprise-token
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8181/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
```

**Step 2: Verify compose file syntax**

Run: `docker compose config --quiet`
Expected: No errors

**Step 3: Commit**

```bash
git add compose.yaml
git commit -m "feat: add Enterprise service to Docker Compose behind profile"
```

---

### Task 8: Update documentation

Update architecture docs and README with caching, plugin, and Enterprise setup steps.

**Files:**
- Modify: `docs/architecture.md`
- Modify: `README.md`

**Step 1: Update `docs/architecture.md`**

Add these sections after the existing "Technology Stack" table:

```markdown
## Caching

The application uses two InfluxDB 3 in-memory caches for fast queries:

| Cache | Type | Database | Table | Purpose |
|-------|------|----------|-------|---------|
| `deviceStatus` | Last Value Cache | `iot_center` | `sensor_data` | Sub-10ms latest readings per device |
| `deviceList` | Distinct Value Cache | `iot_center_devices` | `deviceauth` | Sub-30ms device enumeration |

Both caches are optional. The app falls back to standard SQL queries if caches are not configured.

## Processing Engine

The `plugins/sensor_guard.py` plugin validates incoming sensor data on WAL flush:

- Checks temperature range (-50 to 150) and humidity range (0 to 100)
- Writes out-of-range readings to a `sensor_alerts` table
- Trigger type: WAL flush on `sensor_data` table

## Enterprise Support

Set `INFLUX_EDITION=enterprise` to enable Enterprise features:

| Feature | Core | Enterprise |
|---------|------|------------|
| Auth tokens | Application-level (stored in DB) | Fine-grained database tokens |
| Data retention | Database-level only | Per-table retention periods |
| Historical queries | ~72 hours (uncompacted) | Unlimited (compacted) |
| Caches (LVC/DVC) | Yes | Yes |
| Processing Engine | Yes | Yes |
```

**Step 2: Update `README.md`**

Add setup sections for caches, plugin, and Enterprise after the existing setup instructions. The exact content depends on the current README structure — add sections for:

- **Set up caches** — CLI commands for creating the LVC and DVC
- **Set up the Processing Engine plugin** — CLI commands to install and create the trigger
- **Enterprise setup** — How to run with Enterprise using Docker Compose profiles
- **API endpoints** — Updated table including the new `/status` endpoint

**Step 3: Commit**

```bash
git add docs/architecture.md README.md
git commit -m "docs: add caching, plugin, and Enterprise setup instructions"
```

---

## Task Summary

| Task | Description | New files | Modified files |
|------|-------------|-----------|---------------|
| 1 | Add `edition` to config | — | `lib/influxdb.js`, `__tests__/api.test.js` |
| 2 | DVC fast path for device listing | — | `_devices.js`, `__tests__/api.test.js` |
| 3 | LVC device status endpoint | — | `[[...deviceParams]].js`, `__tests__/api.test.js` |
| 4 | Processing Engine plugin | `plugins/sensor_guard.py` | — |
| 5 | Enterprise module | `lib/enterprise.js` | `__tests__/api.test.js` |
| 6 | Enterprise conditional in create | — | `create.js`, `__tests__/api.test.js` |
| 7 | Enterprise Docker Compose service | — | `compose.yaml` |
| 8 | Documentation updates | — | `docs/architecture.md`, `README.md` |
