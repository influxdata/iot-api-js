import { getDevices } from './_devices'
import { write, config, generateDeviceToken } from '../../../lib/influxdb'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const deviceId = JSON.parse(req.body)?.deviceId

    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId is required' })
    }

    const result = await createDevice(deviceId)
    res.status(200).json(result)
  } catch (err) {
    console.error('Device creation error:', err)
    res.status(500).json({ error: `Failed to create device: ${err.message || err}` })
  }
}

/**
 * Creates a new device with an application-level authentication token.
 *
 * In InfluxDB 3 Core, we use application-level tokens stored in the database
 * rather than InfluxDB-native authorization tokens (which require Enterprise
 * resource tokens for per-device permissions).
 *
 * @param {string} deviceId - The unique device identifier
 * @returns {Promise<{deviceId: string, key: string, message: string}>}
 */
async function createDevice(deviceId) {
  // Check if device already exists
  const existingDevices = await getDevices(deviceId)
  const existingDevice = Object.values(existingDevices)[0]

  if (existingDevice?.key) {
    throw new Error('This device ID is already registered and has an authorization.')
  }

  console.log(`createDevice: deviceId=${deviceId}`)

  // Generate application-level token for the device
  const deviceToken = generateDeviceToken()
  const deviceKey = `device_${deviceId}_${Date.now()}`

  // Write device auth record using line protocol
  // Table: deviceauth
  // Tags: deviceId
  // Fields: key, token
  const lineProtocol = `deviceauth,deviceId=${escapeTagValue(deviceId)} key="${escapeFieldValue(deviceKey)}",token="${escapeFieldValue(deviceToken)}"`

  await write(lineProtocol, config.databaseAuth)

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

/**
 * Escapes a tag value for line protocol.
 * Tags cannot contain spaces, commas, or equals signs without escaping.
 * @param {string} value - The tag value to escape
 * @returns {string} The escaped tag value
 */
function escapeTagValue(value) {
  if (typeof value !== 'string') {
    return value
  }
  return value
    .replace(/\\/g, '\\\\')
    .replace(/ /g, '\\ ')
    .replace(/,/g, '\\,')
    .replace(/=/g, '\\=')
}

/**
 * Escapes a string field value for line protocol.
 * String fields are wrapped in quotes and need backslash and quote escaping.
 * @param {string} value - The field value to escape
 * @returns {string} The escaped field value
 */
function escapeFieldValue(value) {
  if (typeof value !== 'string') {
    return value
  }
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
}
