import { getDevices } from './_devices'

export default async function handler(req, res) {
  try {
    const { deviceId } = req.query
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
