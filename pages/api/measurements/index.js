import { InfluxDB } from '@influxdata/influxdb-client'

const INFLUX_ORG = process.env.INFLUX_ORG
const influxdb = new InfluxDB({url: process.env.INFLUX_URL, token: process.env.INFLUX_TOKEN})

export async function getMeasurements(fluxQuery) {
  //console.log(`getMeasurements: fluxQuery :::::: ${fluxQuery}`)
    const queryApi = influxdb.getQueryApi(INFLUX_ORG)

    return await new Promise((resolve, reject) => {
      let result = ''
      queryApi.queryLines(fluxQuery, {
        next(line) {
          result = result.concat(`${line}\n`)
          //console.log(`getMeasurements::::::: ${line}`)
        },
        error: reject,
        complete() {
          resolve(result)
        },
      })
    })
  }