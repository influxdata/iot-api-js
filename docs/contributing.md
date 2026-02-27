# Contributing

## Style Guidelines

- Use ES modules (`import`/`export`)
- Validate all user input before database operations
- Never expose tokens in API responses
- Use descriptive error messages with hints
- Follow existing patterns in the codebase

## Adding a New Endpoint

1. Create file in `pages/api/` following Next.js conventions
2. Import helpers from `lib/influxdb.js`
3. Add input validation (see `DEVICE_ID_PATTERN` example)
4. Add tests in `__tests__/`
5. Update [API Reference](api-reference.md)

### Example Structure

```javascript
import { query, config } from '../../../lib/influxdb'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Validate input
    // Execute query
    // Return response
    res.status(200).json(result)
  } catch (err) {
    console.error('Error:', err)
    res.status(500).json({ error: err.message })
  }
}
```

## Testing

### Writing Tests

Tests use Jest with mocked InfluxDB client:

```javascript
jest.mock('../lib/influxdb', () => ({
  query: jest.fn(),
  write: jest.fn(),
  config: { /* test config */ },
}))

test('creates device', async () => {
  query.mockResolvedValue([])
  write.mockResolvedValue(undefined)

  const { req, res } = createMocks({
    method: 'POST',
    body: { deviceId: 'test-device' },
  })

  await handler(req, res)

  expect(res._getStatusCode()).toBe(200)
})
```

### Test Coverage

Ensure tests cover:
- Happy path
- Input validation (invalid format, missing fields)
- Security (injection attempts, blocked operations)
- Error handling
- HTTP method validation

## Related Resources

- [InfluxDB 3 Core Documentation](https://docs.influxdata.com/influxdb3/core/)
- [influxdb3-js Client](https://github.com/InfluxCommunity/influxdb3-js)
- [IoT Starter Tutorial](https://docs.influxdata.com/influxdb/v2/api-guide/tutorials/nodejs/)
- [iot-api-ui Frontend](https://github.com/influxdata/iot-api-ui)
