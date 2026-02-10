import { query, config } from '../../../lib/influxdb'

/**
 * Gets devices or a particular device when deviceId is specified.
 * Tokens are NEVER returned via public API to prevent unauthorized access.
 *
 * @param {string} [deviceId] - Optional deviceId to filter by
 * @param {Object} [options] - Query options
 * @param {boolean} [options.includeToken=false] - Include token (internal use only)
 * @returns {Promise<Record<string, {deviceId: string, key: string, token?: string, updatedAt: string}>>}
 */
export async function getDevices(deviceId, options = {}) {
  const { includeToken = false } = options
  const database = config.databaseAuth

  // Build SQL query - only include token field for internal verification
  let sql
  if (deviceId !== undefined) {
    const tokenField = includeToken ? ', token' : ''
    sql = `
      SELECT time, deviceId, key${tokenField}
      FROM deviceauth
      WHERE deviceId = '${escapeString(deviceId)}'
      ORDER BY time DESC
      LIMIT 1
    `
  } else {
    // Get all devices - never include tokens in list view
    sql = `
      SELECT time, deviceId, key
      FROM deviceauth
      ORDER BY time DESC
    `
  }

  const rows = await query(sql, database)

  // Transform rows into devices object keyed by deviceId
  const devices = {}

  for (const row of rows) {
    const id = row.deviceId
    if (!id) {
      continue
    }

    // If we already have this device, only update if this row is newer
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

    // Only include token for internal calls that explicitly request it
    if (includeToken && row.token) {
      devices[id].token = row.token
    }
  }

  return devices
}

/**
 * Escapes a string for use in SQL queries to prevent SQL injection.
 * @param {string} str - The string to escape
 * @returns {string} The escaped string
 */
function escapeString(str) {
  if (typeof str !== 'string') {
    return str
  }
  // Escape single quotes by doubling them
  return str.replace(/'/g, "''")
}
