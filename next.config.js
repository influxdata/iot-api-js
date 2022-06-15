module.exports = {
    async headers() {
      return [
        {
          source: '/api/devices/:deviceParams/measurements',
          headers: [
            {
              key: 'Content-Type',
              value: 'application/csv',
            },
          ],
        },
      ]
    },
  }