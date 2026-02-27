# Code Patterns

## InfluxDB 3 Client

### Client Factory

Always use the helper functions from `lib/influxdb.js`:

```javascript
import { query, write, createClient, config } from '../../../lib/influxdb'
```

### Querying with SQL

```javascript
const sql = `
  SELECT time, deviceId, key
  FROM deviceauth
  WHERE deviceId = '${escapeString(deviceId)}'
  ORDER BY time DESC
  LIMIT 1
`
const rows = await query(sql, config.databaseAuth)
```

### Writing Data with Points

```javascript
import { Point } from '@influxdata/influxdb3-client'

const point = Point.measurement('deviceauth')
  .setTag('deviceId', deviceId)
  .setStringField('key', deviceKey)
  .setStringField('token', deviceToken)

await write(point.toLineProtocol(), config.databaseAuth)
```

### Client Lifecycle

The helpers manage client lifecycle automatically. If using `createClient()` directly:

```javascript
const client = createClient()
try {
  // Use client...
} finally {
  await client.close()
}
```

## Input Validation

### DeviceId Pattern

```javascript
const DEVICE_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/

if (!DEVICE_ID_PATTERN.test(deviceId)) {
  return res.status(400).json({
    error: 'Invalid deviceId format',
    hint: 'deviceId must be 1-64 characters, alphanumeric with hyphens and underscores only',
  })
}
```

### SQL Query Validation

```javascript
const BLOCKED_PATTERNS = [
  /\b(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|TRUNCATE|GRANT|REVOKE)\b/i,
  /\b(EXEC|EXECUTE|CALL)\b/i,
  /;\s*\w/i,  // Multiple statements
]

function validateQuery(query) {
  if (query.length > 2000) return { valid: false, error: 'Query too long' }
  if (!query.trim().toUpperCase().startsWith('SELECT')) {
    return { valid: false, error: 'Only SELECT queries allowed' }
  }
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(query)) return { valid: false, error: 'Blocked operation' }
  }
  return { valid: true }
}
```

## API Handler Pattern

```javascript
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    // Validate input...
    // Process request...
    res.status(200).json(result)
  } catch (err) {
    console.error('Handler error:', err)
    res.status(500).json({ error: `Operation failed: ${err.message}` })
  }
}
```

## Security Patterns

### Token Protection

Never expose tokens in API responses:

```javascript
// In _devices.js
export async function getDevices(deviceId, options = {}) {
  const { includeToken = false } = options  // Default: no token

  // Only include token field for internal verification
  const tokenField = includeToken ? ', token' : ''
  // ...
}
```

### SQL Escaping

```javascript
function escapeString(str) {
  if (typeof str !== 'string') return str
  return str.replace(/'/g, "''")
}
```

Note: Prefer validating input format over escaping when possible.
