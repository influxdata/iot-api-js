# iot-api-js

This example project provides a Node.js server-side REST API that interacts with InfluxDB.
It is an adaptation of [InfluxData IoT Center](https://github.com/bonitoo-io/iot-center-v2), simplified to accompany the InfluxData IoT Starter tutorial.
You can consume this API with the example [iot-api-ui](https://github.com/influxdata/iot-api-ui) React frontend.
The project uses the [Next.js](https://nextjs.org/) framework and the InfluxDB API client library for JavaScript.

## Features

This application demonstrates how you can use InfluxDB client libraries to do the following:

- Create and manage InfluxDB authorizations (API tokens and permissions).
- Write and query device metadata in InfluxDB.
- Write and query telemetry data in InfluxDB.
- Generate data visualizations with the InfluxDB Giraffe library.

## Get started

To learn how to create the app from scratch, follow the IoT Starter tutorial.
To run the app, do the following:

1. If you don't already have an InfluxDB instance, [create an InfluxDB Cloud account](https://www.influxdata.com/products/influxdb-cloud/) or [install InfluxDB OSS](https://www.influxdata.com/products/influxdb/).
2. Clone this repository to your machine.
3. Change to the directory--for example, enter the following code into the terminal:

   ```bash
   cd ./iot-api-js
   ```

4. If you haven't already, follow the [Node.js installation instructions](https://nodejs.org/) to install `node` for your operating system.
5. To check the installed `node` version, enter the following code into your terminal:

   ```bash
   node --version
   ```

6. Follow the [Yarn installation instructions](https://yarnpkg.com/getting-started/install#nodejs-1610-1) to install the `yarn` package manager for your version of Node.js.
7. To check the installed `yarn` version, enter the following code into your terminal:

   ```bash
   yarn --version
   ```

8. With `yarn` installed, enter the following code into your terminal to install the project dependencies:

   ```bash
   yarn
   ```

9. Add a `./.env.local` file that contains the following configuration variables:

   ```bash
   # Local environment secrets

   INFLUX_TOKEN=INFLUXDB_ALL_ACCESS_TOKEN
   INFLUX_ORG=INFLUXDB_ORG_ID
   ```

   Replace the following:

   - **`INFLUXDB_ALL_ACCESS_TOKEN`** with your InfluxDB **All Access** token.
   - **`INFLUXDB_ORG_ID`** with your InfluxDB organization ID.
  
10. To start the application in **development** mode, enter the following code into the terminal:

     ```bash
     yarn dev -p 3001
     ```

     The application server starts with the following output:

     ```bash
     > dev
     > next dev
     ready - started server on 0.0.0.0:3001, url: http://localhost:3001
     ```

11. In your browser, visit <http://localhost:3001/devices> to view the API output.
12. Next, you can use the example [iot-api-ui](https://github.com/influxdata/iot-api-ui) React frontend to interact with the API.
