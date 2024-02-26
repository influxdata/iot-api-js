import { InfluxDB } from '@influxdata/influxdb-client'
import { flux } from '@influxdata/influxdb-client'

const INFLUX_ORG = process.env.INFLUX_ORG
const INFLUX_BUCKET_AUTH = process.env.INFLUX_BUCKET_AUTH
const influxdb = new InfluxDB({url: process.env.INFLUX_URL, token: process.env.INFLUX_TOKEN})

/**
 * Gets devices or a particular device when deviceId is specified. Tokens
 * are not returned unless deviceId is specified. It can also return devices
 * with empty/unknown key, such devices can be ignored (InfluxDB authorization is not associated).
 * @param deviceId optional deviceId
 * @returns promise with an Record<deviceId, {deviceId, createdAt, updatedAt, key, token}>.
 */
 export async function getDevices(deviceId) {
  console.log(`getDevices: deviceId=${deviceId}`)
    const queryApi = influxdb.getQueryApi(INFLUX_ORG)
    //console.log(`getDevices: queryApi=${JSON.stringify(queryApi)} \n`)
    const deviceFilter =
      deviceId !== undefined
        ? flux`r.site_id == "${deviceId}"`
        : flux`r._field != "token"`
    //console.log(`getDevices: deviceFilter :::::::: ${deviceFilter}`)
    const fluxQuery = flux`from(bucket:${INFLUX_BUCKET_AUTH})
      |> range(start: 0)
      |> filter(fn: (r) =>${deviceFilter})
      |> last()`
    
    console.log(`getDevices: fluxQuery = ${fluxQuery}`)
    const devices = {}

    return await new Promise((resolve, reject) => {
      queryApi.queryRows(fluxQuery, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row)
          //console.log(`getDevices: o = ${JSON.stringify(o)}`)
          const deviceId = o.site_id
          //console.log(`getDevices: deviceId = ${deviceId}`)
          if (!deviceId) {
            return
          }
          const device = devices[deviceId] || (devices[deviceId] = {deviceId})
          //console.log(`getDevices: device = ${JSON.stringify(device)}`)
          device[o._field] = o._value
          if (!device.updatedAt || device.updatedAt < o._time) {
            device.updatedAt = o._time
          }
        },
        error: reject,
        complete() {
          resolve(devices)
        },
      })
    })
  }
 