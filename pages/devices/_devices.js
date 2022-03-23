import React, { useState, useEffect } from 'react';

export default function Devices() {
    const [data, setData] = useState(null)
    const [isLoading, setLoading] = useState(false)

    useEffect(() => {
      setLoading(true)
      fetch('api/devices')
        .then((res) => res.json())
        .then((data) => {
          if(Array.isArray(data)) {
            setData(data)
          }
          if(data.error) {
            console.log(data.error)
          }
          setLoading(false)
        })
    }, [])

    if (isLoading) return <p>Loading...</p>
    if (!data) return <p>No device data</p>

  return (
    <>
        <h2>Registered devices</h2>

        { data.map(item => (
            <dl key={item.key}>
            <dt>{item.deviceId}</dt>
            <dd>Updated at: {item.updatedAt}</dd>
            </dl>)
          )
        }

    </>
  )
}
