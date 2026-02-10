/**
 * API Endpoint Tests for iot-api-js
 *
 * These tests verify the behavior of the IoT API endpoints.
 * Run with: npm test (after adding test script to package.json)
 *
 * Note: These tests mock the InfluxDB client to run without a database.
 */

import { createMocks } from 'node-mocks-http'

// Mock the influxdb module before importing handlers
jest.mock('../lib/influxdb', () => ({
  query: jest.fn(),
  write: jest.fn(),
  config: {
    host: 'http://localhost:8181',
    token: 'test-token',
    database: 'iot_center',
    databaseAuth: 'iot_center_devices',
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

import createHandler from '../pages/api/devices/create'
import devicesHandler from '../pages/api/devices/[[...deviceParams]]'
import { query, write } from '../lib/influxdb'

describe('POST /api/devices/create', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('creates a new device with valid deviceId', async () => {
    query.mockResolvedValue([]) // No existing device
    write.mockResolvedValue(undefined)

    const { req, res } = createMocks({
      method: 'POST',
      body: { deviceId: 'sensor-001' },
    })

    await createHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.deviceId).toBe('sensor-001')
    expect(data.token).toBeDefined()
    expect(data.message).toContain('registered successfully')
  })

  test('rejects invalid deviceId with special characters', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { deviceId: 'sensor<script>alert(1)</script>' },
    })

    await createHandler(req, res)

    expect(res._getStatusCode()).toBe(400)
    const data = JSON.parse(res._getData())
    expect(data.error).toContain('Invalid deviceId format')
  })

  test('rejects deviceId with newlines (injection attempt)', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { deviceId: 'sensor\nmalicious,tag=evil field=1' },
    })

    await createHandler(req, res)

    expect(res._getStatusCode()).toBe(400)
  })

  test('rejects missing deviceId', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {},
    })

    await createHandler(req, res)

    expect(res._getStatusCode()).toBe(400)
    const data = JSON.parse(res._getData())
    expect(data.error).toContain('deviceId is required')
  })

  test('rejects non-POST methods', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    })

    await createHandler(req, res)

    expect(res._getStatusCode()).toBe(405)
  })

  test('rejects duplicate device registration', async () => {
    query.mockResolvedValue([
      { deviceId: 'existing-device', key: 'existing-key', time: new Date() },
    ])

    const { req, res } = createMocks({
      method: 'POST',
      body: { deviceId: 'existing-device' },
    })

    await createHandler(req, res)

    expect(res._getStatusCode()).toBe(500)
    const data = JSON.parse(res._getData())
    expect(data.error).toContain('already registered')
  })
})

describe('GET /api/devices', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('lists all devices without tokens', async () => {
    query.mockResolvedValue([
      { deviceId: 'device-1', key: 'key-1', time: new Date() },
      { deviceId: 'device-2', key: 'key-2', time: new Date() },
    ])

    const { req, res } = createMocks({
      method: 'GET',
      query: { deviceParams: [] },
    })

    await devicesHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data).toHaveLength(2)
    // Verify tokens are NOT exposed
    expect(data[0].token).toBeUndefined()
    expect(data[1].token).toBeUndefined()
  })

  test('returns specific device without token', async () => {
    query.mockResolvedValue([
      { deviceId: 'device-1', key: 'key-1', time: new Date() },
    ])

    const { req, res } = createMocks({
      method: 'GET',
      query: { deviceParams: ['device-1'] },
    })

    await devicesHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data[0].deviceId).toBe('device-1')
    // Token should NOT be exposed even for specific device
    expect(data[0].token).toBeUndefined()
  })
})

describe('POST /api/devices/:deviceId/measurements', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('executes valid SELECT query', async () => {
    query.mockResolvedValue([
      { time: new Date(), room: 'Kitchen', temp: 22.5 },
    ])

    const { req, res } = createMocks({
      method: 'POST',
      query: { deviceParams: ['device-1', 'measurements'] },
      body: { query: 'SELECT * FROM home LIMIT 10' },
    })

    await devicesHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
  })

  test('rejects DROP TABLE query', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      query: { deviceParams: ['device-1', 'measurements'] },
      body: { query: 'DROP TABLE home' },
    })

    await devicesHandler(req, res)

    expect(res._getStatusCode()).toBe(400)
    const data = JSON.parse(res._getData())
    expect(data.error).toContain('Only SELECT queries are allowed')
  })

  test('rejects DELETE query', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      query: { deviceParams: ['device-1', 'measurements'] },
      body: { query: 'DELETE FROM home WHERE 1=1' },
    })

    await devicesHandler(req, res)

    expect(res._getStatusCode()).toBe(400)
  })

  test('rejects UPDATE query', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      query: { deviceParams: ['device-1', 'measurements'] },
      body: { query: "UPDATE home SET temp=0 WHERE room='Kitchen'" },
    })

    await devicesHandler(req, res)

    expect(res._getStatusCode()).toBe(400)
  })

  test('rejects multi-statement injection', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      query: { deviceParams: ['device-1', 'measurements'] },
      body: { query: 'SELECT * FROM home; DROP TABLE home' },
    })

    await devicesHandler(req, res)

    expect(res._getStatusCode()).toBe(400)
    const data = JSON.parse(res._getData())
    expect(data.error).toContain('blocked operations')
  })

  test('rejects excessively long queries', async () => {
    const longQuery = 'SELECT * FROM home WHERE ' + 'x=1 OR '.repeat(500)

    const { req, res } = createMocks({
      method: 'POST',
      query: { deviceParams: ['device-1', 'measurements'] },
      body: { query: longQuery },
    })

    await devicesHandler(req, res)

    expect(res._getStatusCode()).toBe(400)
    const data = JSON.parse(res._getData())
    expect(data.error).toContain('maximum length')
  })

  test('rejects missing query parameter', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      query: { deviceParams: ['device-1', 'measurements'] },
      body: {},
    })

    await devicesHandler(req, res)

    expect(res._getStatusCode()).toBe(400)
    const data = JSON.parse(res._getData())
    expect(data.error).toContain('Missing query parameter')
  })

  test('rejects GET method for measurements', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { deviceParams: ['device-1', 'measurements'] },
    })

    await devicesHandler(req, res)

    expect(res._getStatusCode()).toBe(405)
  })
})
