# iot-api-js

> [!WARNING]
> #### ⚠️ Sample Application Notice
> This is a **reference implementation** for learning purposes. It demonstrates InfluxDB 3 client library usage patterns but is **not production-ready**.
>
> **Not included:** Authentication/authorization, rate limiting, comprehensive error handling, input sanitization for all edge cases, secure credential management, high availability, or production logging.
>
> **Before deploying to production**, implement proper security controls, follow your organization's security guidelines, and conduct a thorough security review.

This example project provides a Node.js REST API server that interacts with InfluxDB 3 Core.
The project uses the [Next.js](https://nextjs.org/) framework and the [InfluxDB 3 JavaScript client library](https://github.com/InfluxCommunity/influxdb3-js) to demonstrate how to build an app that collects, stores, and queries IoT device data.
After you have set up and run your `iot-api-js` API server, you can consume your API using the [iot-api-ui](https://github.com/influxdata/iot-api-ui) standalone React frontend.

## Features

This application demonstrates how you can use the InfluxDB 3 client library to do the following:

- Register IoT devices with application-level tokens.
- Write and query device metadata in InfluxDB 3.
- Write and query telemetry data using SQL queries.
- Explore data using the InfluxDB 3 SQL query interface.

## Tutorial and support

This app is an adaptation of [InfluxData IoT Center](https://github.com/bonitoo-io/iot-center-v2), simplified to demonstrate InfluxDB 3 Core integration patterns.

For help, refer to the InfluxDB 3 documentation or use the following resources:

- [InfluxDB 3 Core Documentation](https://docs.influxdata.com/influxdb3/core/)
- [InfluxDB 3 JavaScript Client](https://github.com/InfluxCommunity/influxdb3-js)
- [InfluxData Community](https://community.influxdata.com/)
- [InfluxDB Community Slack](https://influxdata.com/slack)

To report a problem, submit an issue to this repo.

## Get started

### Set up InfluxDB 3 Core

1. Install and start InfluxDB 3 Core following the [installation guide](https://docs.influxdata.com/influxdb3/core/get-started/setup/).

2. Create the required databases:

   ```bash
   # Create database for telemetry data
   influxdb3 create database iot_center

   # Create database for device authentication
   influxdb3 create database iot_center_devices
   ```

3. Create an admin token for the API server:

   ```bash
   influxdb3 create token --admin
   ```

   Save the token value for the next step.

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

   INFLUX_TOKEN=YOUR_ADMIN_TOKEN
   ```

   Replace **`YOUR_ADMIN_TOKEN`** with the admin token you created in the previous step.

4. If you need to adjust the default host or database names, edit the settings in `.env.development` or set them in `.env.local` (to override `.env.development`):

   ```bash
   # Default settings (can be overridden in .env.local)
   INFLUX_HOST=http://localhost:8181
   INFLUX_DATABASE=iot_center
   INFLUX_DATABASE_AUTH=iot_center_devices
   ```
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

### Error: could not find database

```json
{"error":"failed to load data: database \"iot_center_devices\" not found"}
```

Solution: [create the databases](#set-up-influxdb-3-core) or adjust the defaults in `.env.development` to match your InfluxDB instance.

## Learn More

### InfluxDB 3

- [InfluxDB 3 Core Documentation](https://docs.influxdata.com/influxdb3/core/)
- [InfluxDB 3 Enterprise Documentation](https://docs.influxdata.com/influxdb3/enterprise/)
- [InfluxDB 3 JavaScript Client](https://github.com/InfluxCommunity/influxdb3-js)
- [Query data with SQL](https://docs.influxdata.com/influxdb3/core/query-data/sql/)

### Next.js

To learn more about Next.js, see the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
