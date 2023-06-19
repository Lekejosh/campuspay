/*
 * server.js
 * Created By Adeleke Joshua A.
 * 19/06/2023
 */
const app = require("./app");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary");
const { key, cert } = require("./certificates");
const https = require("https");
const http = require("http");
require("dotenv").config();
require("./utils/auth");

process.on("uncaughtException", (err) => {
  console.log(`Error: $err: ${err.message}`);
  console.log(`Shutting down the server due to uncaught Expectation`);
  process.exit(1);
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_APIKEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

mongoose.set("strictQuery", true);

// Check if running in Docker container
const isDocker = process.env.DOCKER === "true";

// MongoDB connection URL
const mongoURL = isDocker
  ? `${process.env.DB_URI}/${process.env.DB_NAME}`
  : `${process.env.DB_URI_1}/${process.env.DB_NAME}`;

mongoose
  .connect(mongoURL)
  .then(() => {
    // Create an HTTP server
    const httpServer = http.createServer(app);
    httpServer.listen(process.env.PORT, () => {
      console.log(
        `HTTP Server is working on http://localhost:${process.env.PORT}`
      );
    });

    // Create an HTTPS server
    const httpsServer = https.createServer({ key, cert }, app);
    httpsServer.listen(process.env.HTTPS_PORT, () => {
      console.log(
        `HTTPS Server is working on https://localhost:${process.env.HTTPS_PORT}`
      );
    });
  })
  .catch((err) => {
    console.error(err);
  });

process.on("unhandledRejection", (err) => {
  console.log(`Error: $err: ${err.message}`);
  console.log(`Shutting down the server due to an unhandled promise rejection`);

  // Close the servers gracefully
  httpServer.close(() => {
    httpsServer.close(() => {
      process.exit(1);
    });
  });
});
