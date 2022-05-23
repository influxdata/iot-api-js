# iot-api-js

This project is an example NextJS (NodeJS and React) application that uses the InfluxDB API client library for Javascript.
The application is an adaptation of [InfluxData IoT Center](https://github.com/bonitoo-io/iot-center-v2), intentionally simplified to accompany the InfluxData IoT Starter tutorial.

## Features

This application demonstrates how you can use InfluxDB client libraries to do the following:

- Create and manage InfluxDB authorizations (API tokens and permissions).
- Write and query device metadata in InfluxDB.
- Write and query telemetry data in InfluxDB.
- Generate data visualizations with the InfluxDB UI libraries.

## Get started

To run the app, follow the IoT Starter tutorial or do the following:

1. Clone this repository to your machine.
2. Change to the directory--for example, enter the following code into the terminal:

   ```bash
   cd ./iot-api-js
   ```

3. If you haven't already, install [Node.js](https://nodejs.org/).
4. With `node` installed, run `npm install` (included with Node.js) to install project dependencies.
5. Add a `./.env.local` file that contains the following configuration variables:

   ```bash
   # Local environment secrets

   INFLUX_TOKEN=INFLUXDB_ALL_ACCESS_TOKEN
   INFLUX_ORG=INFLUXDB_ORG_ID
   ```

   Replace the following:

   - **`INFLUXDB_ALL_ACCESS_TOKEN`** with your InfluxDB **All Access** token.
   - **`INFLUXDB_ORG_ID`** with your InfluxDB organization ID.
  
6. To start the application in **development** mode, enter the following code into the terminal:

   ```bash
   npm dev
   ```

   The application server starts with the following output:

   ```bash
   > dev
   > next dev
   ready - started server on 0.0.0.0:3000, url: http://localhost:3000
   ```

7. In your browser, visit [http://localhost:3000/devices](http://localhost:3000/devices) to view the application.

## Credits

Based on the [Learn Next.js](https://nextjs.org/learn) starter template and [InfluxData IoT Center](https://github.com/bonitoo-io/iot-center-v2).
