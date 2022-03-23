import React, { useState, useEffect } from 'react'
import Devices from './_devices'

export default function CreateDevice() {
  const [device, setDevice] = useState(null)
  const [isLoading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deviceId, setDeviceId] = useState('')

  function handleRegister(event) {
    setLoading(true)
    const body = JSON.stringify({ deviceId })

    fetch('/api/devices/create', { method: 'POST', body })
      .then((res) => res.json())
      .then((data) => {
        if(Array.isArray(data)) {
          setDevice(data)
        }
        if(data.error) {
          setError(data.error)
        }
        setLoading(false)
      })
  }

  function handleChange(event) {
    setError('')
    setDeviceId(event.target.value)
  }

  if (isLoading) return <p>Loading...</p>

  return (
    <>
      { error &&
         <div className="alert alert-danger">{ error }</div>
      }
      <h2>Register a device</h2>
      <form onSubmit={ handleRegister }>
        <label>
          New device ID:
          <input type="text" name="register_deviceId" onChange={ handleChange } />
        </label>
        <input type="submit" value="Register" />
      </form>

      <div>
        <Devices />
      </div>
    </>
  )
}
