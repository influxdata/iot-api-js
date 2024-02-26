import { getMeasurements } from '../measurements'
import { getDevices } from './_devices'

export default async function handler(req, res) {
  try {
    const {deviceParams} = req.query
    console.log("device params",deviceParams)
    let deviceId = undefined
    let path = []
    if(Array.isArray(deviceParams)) {
      [deviceId, ...path] = deviceParams
      console.log("deviceId",deviceId)
      console.log("path",path)
    }
    if(Array.isArray(path) && path[0] === 'measurements') {
      const {query} = req.body
      console.log("query ::::::: ",query)
      if(query) {
        const data = await getMeasurements(query)
        //console.log("data fetched",data)
        res.status(200).send(data)
      }
      return
    }
    console.log("here ")
   
    const devices = await getDevices(deviceId)
    //console.log("devices:::: ",devices)
    res.status(200).json(
      Object.values(devices)
        .filter((x) => x.deviceId) // ignore deleted or unknown devices
        .sort((a, b) => a.deviceId.localeCompare(b.deviceId))
    )
  } catch(err) {
      res.status(500).json({ error: `failed to load data ::: ${err}` })
  }
}
