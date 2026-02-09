import { getMeasurements } from '../measurements'
import { getDevices } from './_devices'

/**
 * API handler for device-related endpoints:
 *
 * GET /api/devices - List all registered devices
 * GET /api/devices/:deviceId - Get a specific device
 * POST /api/devices/:deviceId/measurements - Query measurements for a device
 *
 * Note: For measurement queries, the `query` parameter must be a SQL query.
 * Flux queries are not supported in InfluxDB 3.
 *
 * Example SQL query for measurements:
 *   SELECT * FROM home WHERE room = 'Kitchen' ORDER BY time DESC LIMIT 100
 */
export default async function handler(req, res) {
  try {
    const { deviceParams } = req.query
    let deviceId = undefined
    let path = []

    if (Array.isArray(deviceParams)) {
      [deviceId, ...path] = deviceParams
    }

    // Handle measurement queries: POST /api/devices/:deviceId/measurements
    if (Array.isArray(path) && path[0] === 'measurements') {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use POST for measurement queries.' })
      }

      const { query } = req.body || {}
      if (!query) {
        return res.status(400).json({
          error: 'Missing query parameter',
          hint: 'Provide a SQL query in the request body. Flux is not supported in InfluxDB 3.',
          example: "SELECT * FROM home WHERE time >= now() - INTERVAL '1 hour' ORDER BY time DESC",
        })
      }

      const data = await getMeasurements(query)
      res.status(200).send(data)
      return
    }

    // Handle device listing/retrieval: GET /api/devices or GET /api/devices/:deviceId
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const devices = await getDevices(deviceId)
    res.status(200).json(
      Object.values(devices)
        .filter((x) => x.deviceId && x.key) // Ignore deleted or unknown devices
        .sort((a, b) => a.deviceId.localeCompare(b.deviceId))
    )
  } catch (err) {
    console.error('Device API error:', err)
    res.status(500).json({ error: `Failed to load data: ${err.message || err}` })
  }
}
