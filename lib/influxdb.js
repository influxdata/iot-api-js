import { InfluxDBClient, Point } from '@influxdata/influxdb3-client'
import { randomBytes } from 'crypto'

// Re-export Point class for use in other modules
export { Point }

/**
 * Creates a new InfluxDB 3 client instance.
 * Always call client.close() when done to release resources.
 *
 * @returns {InfluxDBClient} A new InfluxDB client instance
 */
export function createClient() {
  return new InfluxDBClient({
    host: process.env.INFLUX_HOST,
    token: process.env.INFLUX_TOKEN,
  })
}

/**
 * Environment configuration for InfluxDB 3
 */
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
}

/**
 * Executes a SQL query and returns results as an array.
 *
 * @param {string} sql - The SQL query to execute
 * @param {string} database - The database to query
 * @returns {Promise<Array>} Array of row objects
 */
export async function query(sql, database) {
  const client = createClient()
  try {
    const results = []
    for await (const row of client.query(sql, database)) {
      results.push(row)
    }
    return results
  } finally {
    await client.close()
  }
}

/**
 * Writes line protocol data to InfluxDB.
 *
 * @param {string|Array} lines - Line protocol string(s) to write
 * @param {string} database - The database to write to
 */
export async function write(lines, database) {
  const client = createClient()
  try {
    const data = Array.isArray(lines) ? lines.join('\n') : lines
    await client.write(data, database)
  } finally {
    await client.close()
  }
}

/**
 * Generates a secure application-level token for device authentication.
 * In InfluxDB 3 Core, we use application-level tokens stored in the database
 * rather than InfluxDB-native authorization tokens.
 *
 * @returns {string} A secure random token string
 */
export function generateDeviceToken() {
  // Generate a secure random token using Node.js crypto
  return 'iot_' + randomBytes(32).toString('hex')
}
