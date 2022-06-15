import { InfluxDB } from '@influxdata/influxdb-client'

const INFLUX_ORG = process.env.INFLUX_ORG
const influxdb = new InfluxDB({url: process.env.INFLUX_URL, token: process.env.INFLUX_TOKEN})

export async function getMeasurements(fluxQuery) {
    const queryApi = influxdb.getQueryApi(INFLUX_ORG)

    return await new Promise((resolve, reject) => {
      let result = ''
      queryApi.queryLines(fluxQuery, {
        next(line) {
          result = result.concat(`${line}\n`)
        },
        error: reject,
        complete() {
          resolve(result)
        },
      })
    })
  }