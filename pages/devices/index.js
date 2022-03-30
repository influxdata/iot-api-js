import React, { useState, useEffect } from 'react'
import DeviceRegistrationButton from './_deviceRegistrationForm'
import DeviceList from './_deviceList'

export default function() {
  const [deviceId, setDeviceId] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  function handleChange(event) {
    setError('')
    setDeviceId(event.target.value)
  }

  function handleError(error) {
    console.log(error)
    setError(error)
  }

  return(
      <div className="card">
        <div className="alert">
        { isLoading && <span>Loading...</span>}
        { error &&
          <span className="alert-danger">{ error }</span>
        }
        </div>
        <form>
          <label>
            Device ID:
            <input type="text" name="register_deviceId" onChange={ handleChange } />
          </label>
          <DeviceRegistrationButton deviceId={ deviceId } onError={ handleError } isLoading={ setIsLoading } />
          <h2>Registered devices</h2>
          <DeviceList deviceId={ deviceId } isLoading={ setIsLoading }  />
        </form>
      </div>
  )
}
