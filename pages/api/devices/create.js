import { getDevices } from './_devices'
import { write, config, generateDeviceToken, Point } from '../../../lib/influxdb'

// Valid deviceId pattern: alphanumeric, hyphens, underscores, 1-64 chars
const DEVICE_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/

export default async function handler(req, res) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

  try {
    // Handle both pre-parsed objects and JSON strings
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const deviceId = body?.deviceId
    if (!deviceId) {
			return res.status(400).json({ error: 'deviceId is required' });
		}

    // Validate deviceId format to prevent injection attacks
    if (!DEVICE_ID_PATTERN.test(deviceId)) {
      return res.status(400).json({
        error: 'Invalid deviceId format',
        hint: 'deviceId must be 1-64 characters, alphanumeric with hyphens and underscores only',
      })
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
 * We store device tokens in the database.
 * With InfluxDB 3 Enterprise, we can use fine-grained database tokens.
 * With InfluxDB 3 Core, you can use application-level admin tokens. Core doesn't provide fine-grained tokens.
 *
 * @param {string} deviceId - The unique device identifier
 * @returns {Promise<{deviceId: string, key: string, token: string, database: string, host: string, message: string}>}
 */
async function createDevice(deviceId) {
	// Check if device already exists
	const existingDevices = await getDevices(deviceId);
	const existingDevice = Object.values(existingDevices)[0];

	if (existingDevice?.key) {
		throw new Error('This device ID is already registered and has an authorization.');
	}

	console.log(`createDevice: deviceId=${deviceId}`);

	// Generate application-level token for the device
	const deviceToken = generateDeviceToken();
	const deviceKey = `device_${deviceId}_${Date.now()}`;

  // Write device auth record using Point class
  // Table: deviceauth
  // Tags: deviceId
  // Fields: key, token
  const point = Point.measurement('deviceauth')
    .setTag('deviceId', deviceId)
    .setStringField('key', deviceKey)
    .setStringField('token', deviceToken)

  await write(point.toLineProtocol(), config.databaseAuth)

	console.log(`Device created: ${deviceId}`);

	return {
		deviceId,
		key: deviceKey,
		token: deviceToken,
		database: config.database,
		host: config.host,
		message: 'Device registered successfully. Use the provided token for device authentication.',
	};
}
