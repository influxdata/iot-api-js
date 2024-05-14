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

To learn how to create the app from scratch, [follow the IoT Starter tutorial](#follow-tutorials).

To run the app, do the following:

1. If you don't already have an InfluxDB instance, [create an InfluxDB Cloud account](https://www.influxdata.com/products/influxdb-cloud/) or [install InfluxDB OSS](https://www.influxdata.com/products/influxdb/).
2. Set up InfluxDB--the example app assumes you have the following:

   - An InfluxDB [org ID](https://docs.influxdata.com/influxdb/v2/admin/organizations/view-orgs/) 
   - A [bucket](https://docs.influxdata.com/influxdb/v2/admin/buckets/create-bucket/#create-a-bucket-using-the-influxdb-api) named `iot_center` for storing measurement data collected from devices
   - A [bucket](https://docs.influxdata.com/influxdb/v2/admin/buckets/create-bucket/#create-a-bucket-using-the-influxdb-api) named `iot_center_devices` for storing device metadata and API token IDs
   - An [API token](https://docs.influxdata.com/influxdb/v2/admin/tokens/create-token/) (for example, an **All Access token**) that has read and write permissions for the buckets

3. Clone this repository to your machine.
4. Change to the directory--for example, enter the following code into the terminal:

   ```bash
   cd ./iot-api-js
   ```

5. If you haven't already, follow the [Node.js installation instructions](https://nodejs.org/) to install `node` for your operating system.
6. To check the installed `node` version, enter the following code into your terminal:

   ```bash
   node --version
   ```

7. Follow the [Yarn installation instructions](https://yarnpkg.com/getting-started/install#nodejs-1610-1) to install the `yarn` package manager for your version of Node.js.
8. To check the installed `yarn` version, enter the following code into your terminal:

   ```bash
   yarn --version
   ```

9.  With `yarn` installed, enter the following code into your terminal to install the project dependencies:

   ```bash
   yarn
   ```

10. Add a `./.env.local` file that contains the following configuration variables:

   ```bash
   # Local environment secrets

   INFLUX_TOKEN=INFLUXDB_ALL_ACCESS_TOKEN
   INFLUX_ORG=INFLUXDB_ORG_ID
   ```

   Replace the following:

   - **`INFLUXDB_ALL_ACCESS_TOKEN`** with your InfluxDB **All Access** token.
   - **`INFLUXDB_ORG_ID`** with your InfluxDB organization ID.
  
11. To start the application in **development** mode, enter the following code into the terminal:

     ```bash
     yarn dev -p 5200 
     ```

     The application server starts with the following output:

     ```bash
     > dev
     > next dev
     ready - started server on 0.0.0.0:5200, url: http://localhost:5200
     ```

12. In your browser, visit <http://localhost:5200/api/devices> to view the API server output.

    If you haven't yet created the buckets, the `/api/devices` endpoint outputs the following:

    ```json
    {"error":"failed to load data: HttpError: failed to initialize execute state: could not find bucket \"iot_center_devices\""}
    ```

Next, [follow tutorials](#follow-tutorials) or use the example [iot-api-ui](https://github.com/influxdata/iot-api-ui) React frontend to interact with the API.

## Learn More

### Follow tutorials

Follow step-by-step tutorials to build the IoT Starter app:

- [InfluxDB OSS v2 Python and JavaScript tutorials](https://docs.influxdata.com/influxdb/v2/api-guide/tutorials/)
- [InfluxDB Cloud v2 Python and JavaScript tutorials](https://docs.influxdata.com/influxdb/cloud/api-guide/tutorials/)

### Next.js

To learn more about Next.js, see following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
