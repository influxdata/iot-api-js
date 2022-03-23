import { InfluxDB } from '@influxdata/influxdb-client'

export default new InfluxDB({url: process.env.INFLUX_URL, token: process.env.INFLUX_TOKEN})
