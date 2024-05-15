# iot-api-js

This example project provides a Node.js REST API server that interacts with the InfluxDB v2 HTTP API.
The project uses the [Next.js](https://nextjs.org/) framework and the [InfluxDB v2 API client library for JavaScript](https://docs.influxdata.com/influxdb/v2/api-guide/client-libraries/nodejs/) to demonstrate how to build an app that collects, stores, and queries IoT device data.
After you have set up and run your `iot-api-js` API server, you can consume your API using the [iot-api-ui](https://github.com/influxdata/iot-api-ui) standalone React frontend.

## Features

This application demonstrates how you can use InfluxDB client libraries to do the following:

- Create and manage InfluxDB authorizations (API tokens and permissions).
- Write and query device metadata in InfluxDB.
- Write and query telemetry data in InfluxDB.
- Generate data visualizations with the InfluxDB Giraffe library.

## Tutorial and support

To learn how to build this app from scratch, follow the [InfluxDB v2 OSS tutorial](https://docs.influxdata.com/influxdb/v2/api-guide/tutorials/nodejs/) or [InfluxDB Cloud tutorial](https://docs.influxdata.com/influxdb/cloud/api-guide/tutorials/nodejs/).
The app is an adaptation of [InfluxData IoT Center](https://github.com/bonitoo-io/iot-center-v2), simplified to accompany the IoT Starter tutorial.

For help, refer to the tutorials and InfluxDB documentation or use the following resources:

- [InfluxData Community](https://community.influxdata.com/)
- [InfluxDB Community Slack](https://influxdata.com/slack)

To report a problem, submit an issue to this repo or to the [`influxdata/docs-v2` repo](https://github.com/influxdata/docs-v2/issues).

## Get started

### Set up InfluxDB prerequisites

Follow the tutorial instructions to setup your InfluxDB organization, API token, and buckets:

- [Set up InfluxDB OSS v2 prerequisites](https://docs.influxdata.com/influxdb/v2/api-guide/tutorials/nodejs/#set-up-influxdb)
- [Set up InfluxDB Cloud v2 prerequisites](https://docs.influxdata.com/influxdb/cloud/api-guide/tutorials/nodejs/#set-up-influxdb)

Next, [clone and run the API server](#clone-and-run-the-api-server).

### Clone and run the API server

1. Clone this repository to your machine.
2. Change to the directory--for example, enter the following command in your terminal:

   ```bash
   cd ./iot-api-js
   ```

3. Add a `.env.local` file that contains the following configuration variables:

   ```bash
   # Local environment secrets

   INFLUX_TOKEN=INFLUXDB_ALL_ACCESS_TOKEN
   INFLUX_ORG=INFLUXDB_ORG_ID
   ```

   Replace the following:

   - **`INFLUXDB_ALL_ACCESS_TOKEN`** with your InfluxDB **All Access** token.
   - **`INFLUXDB_ORG_ID`** with your InfluxDB organization ID.

4. If you need to adjust the default URL or bucket names to match your InfluxDB instance, edit the settings in `.env.development` or set them in `.env.local` (to override `.env.development`).
5. If you haven't already, follow the [Node.js installation instructions](https://nodejs.org/) to install `node` for your operating system.
6. To check the installed `node` version, enter the following command in your terminal:

   ```bash
   node --version
   ```

7. Follow the [Yarn installation instructions](https://yarnpkg.com/getting-started/install#nodejs-1610-1) to install the `yarn` package manager for your version of Node.js.
8. To check the installed `yarn` version, enter the following command in your terminal:

   ```bash
   yarn --version
   ```

9. Run `yarn` to install the project dependencies:

   ```bash
   yarn
   ```

10. In your terminal, enter the following command to start the application in **development** mode:

     ```bash
     yarn dev -p 5200 
     ```

     The application server starts with the following output:

     ```bash
     > dev
     > next dev
     ready - started server on 0.0.0.0:5200, url: http://localhost:5200
     ```

11. In your browser, visit <http://localhost:5200/api/devices> to view the API server output.

12. _Optional_: Run the [iot-api-ui](https://github.com/influxdata/iot-api-ui) React frontend to interact with your IoT Starter API server.

## Troubleshoot

### Error: could not find bucket

```json
{"error":"failed to load data: HttpError: failed to initialize execute state: could not find bucket \"iot_center_devices\""}
```

Solution: [create buckets](#set-up-influxdb-prerequisites) or adjust the defaults in `.env.development` to match your InfluxDB instance.

## Learn More

### InfluxDB

- Develop with the InfluxDB API for [OSS v2](https://docs.influxdata.com/influxdb/v2/api-guide/) or [Cloud v2](https://docs.influxdata.com/influxdb/cloud/api-guide/).

### Next.js

To learn more about Next.js, see following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
