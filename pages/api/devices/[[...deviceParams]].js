import { getMeasurements } from '../measurements'
import { getDevices } from './_devices'

export default async function handler(req, res) {
  try {
    const {deviceParams} = req.query
    let deviceId = undefined
    let path = []
    if(Array.isArray(deviceParams)) {
      [deviceId, ...path] = deviceParams
    }
    if(Array.isArray(path) && path[0] === 'measurements') {
      const {query} = req.body
      if(query) {
        const data = await getMeasurements(query)
        res.status(200).send(data)
      }
      return
    }
   
    const devices = await getDevices(deviceId)
    res.status(200).json(
      Object.values(devices)
        .filter((x) => x.deviceId && x.key) // ignore deleted or unknown devices
        .sort((a, b) => a.deviceId.localeCompare(b.deviceId))
    )
  } catch(err) {
      res.status(500).json({ error: `failed to load data: ${err}` })
  }
}
