const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const { errorHandler } = require("./middleware");
const logger = require("./utils/logger");
const db = require("./utils/database");

const urlRoutes = require("./routes/index");
const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

app.use("/api", urlRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "URL Shortener API",
    version: "1.0.0",
  });
});

app.get("/:id", async (req, res) => {
  const shortID = req.params.id;
  logger.info(shortID);
  if (!shortID) {
    return res.status(404).send("Invalid Short ID");
  }

  try {
    const query = `SELECT long_url FROM urls WHERE short_id = $1`;
    const { rows: data } = await db.query(query, [shortID]);
    logger.info(data);
    if (!data || data.length === 0) {
      return res.status(404).send("URL not found");
    }

    const target_url = data[0].long_url;
    logger.info(`Redirecting ${shortID} to ${target_url}`);

    const logQuery = `INSERT INTO analytics (short_id, timestamp, user_agent, ip_address) VALUES ($1, $2, $3, $4)`;

    await db.query(logQuery, [
      shortID,
      new Date(),
      req.headers["user-agent"],
      req.ip,
    ]);
    return res.redirect(target_url);
  } catch (error) {
    logger.error("Redirect error:", {
      message: error.message,
      stack: error.stack,
      url: req.originalUrl,
    });
    return res.status(500).send("Server error");
  }
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "The requested resource was not found",
    },
  });
});

app.use(errorHandler);

module.exports = app;
