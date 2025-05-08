// server.js - Main Express server file with multi-sensor endpoint
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "1234",
  database: process.env.DB_NAME || "greenhouse_data",
};

// Create MySQL pool for connection management
const pool = mysql.createPool(dbConfig);

// Existing endpoints...
app.get("/api/sensor-data-simple/:sensorId", async (req, res) => {
  const { sensorId } = req.params;

  // Validate sensor ID
  if (sensorId !== "sensor1" && sensorId !== "sensor2") {
    return res
      .status(400)
      .json({ error: "Invalid sensor ID. Use sensor1 or sensor2." });
  }

  try {
    const [rows] = await pool.query(
      `SELECT * FROM ${sensorId} ORDER BY timestamp DESC LIMIT 100`
    );
    res.json({ data: rows, sensorId });
  } catch (error) {
    console.error("Error fetching simple sensor data:", error);
    res.status(500).json({
      error: "Failed to fetch simple sensor data",
      details: error.message,
    });
  }
});

app.get("/api/sensor-data/:sensorId", async (req, res) => {
  const { sensorId } = req.params;
  const {
    timeRange = "week", // "day" | "week" | "month" | "year"
    paramName,
    paramType = "environment",
  } = req.query;

  // ✅ Validate sensorId
  const validSensors = ["sensor1", "sensor2"];
  if (!validSensors.includes(sensorId.toLowerCase())) {
    return res.status(400).json({
      error: "Invalid sensor ID. Use sensor1 or sensor2.",
    });
  }

  // ✅ Determine exact time range in hours/days
  const rangeMap = {
    day: "INTERVAL 1 DAY",
    week: "INTERVAL 7 DAY",
    month: "INTERVAL 30 DAY", // could use LAST_DAY() for calendar month logic if needed
    year: "INTERVAL 365 DAY",
  };

  const interval = rangeMap[timeRange] || rangeMap["week"];
  const tableName = sensorId.toLowerCase();

  // ✅ Build SQL filter
  const timeFilterSql = `
    timestamp >= DATE_SUB(
      (SELECT MAX(timestamp) FROM \`${tableName}\`),
      ${interval}
    )
  `;

  // ✅ Validate parameter
  const paramsByType = {
    environment: [
      "humidity",
      "temperature",
      "dht_humidity",
      "dht_temperature",
      "soil",
    ],
    nutrients: ["nitrogen", "phosphorus", "potassium", "conductivity", "ph"],
  };
  let columns = "*";
  if (paramName) {
    const validParams = paramsByType[paramType] || [];
    if (!validParams.includes(paramName)) {
      return res.status(400).json({
        error: `Invalid parameter "${paramName}" for type "${paramType}".`,
      });
    }
    columns = `id, timestamp, sensor_id, ${paramName}`;
  }

  try {
    const sql = `
      SELECT ${columns}
      FROM \`${tableName}\`
      WHERE ${timeFilterSql}
      ORDER BY timestamp ASC
    `;
    const [rows] = await pool.query(sql);

    if (!rows.length) {
      return res.status(404).json({
        error: "No data found for the given filters",
        executedSql: sql.trim(),
        timeRange,
        paramName: paramName || null,
        paramType,
        sensorId,
      });
    }

    // ✅ Stats if param is specified
    let stats = { min: 0, max: 0, avg: 0, current: 0 };
    if (paramName) {
      const vals = rows
        .map((r) => parseFloat(r[paramName]))
        .filter((v) => !isNaN(v));
      if (vals.length) {
        stats = {
          min: Math.min(...vals),
          max: Math.max(...vals),
          avg: vals.reduce((s, v) => s + v, 0) / vals.length,
          current: vals[vals.length - 1],
        };
      }
    }

    res.json({
      data: rows,
      stats,
      timeRange,
      paramName: paramName || null,
      paramType,
      sensorId,
    });
  } catch (err) {
    console.error("Error fetching sensor data:", err);
    res.status(500).json({
      error: "Database error",
      details: err.message,
    });
  }
});

// GET /api/sensor-data-latest/:sensorId
app.get("/api/sensor-data-latest/:sensorId", async (req, res) => {
  const { sensorId } = req.params;
  const validSensors = ["sensor1", "sensor2"];

  console.log("Fetching latest data for sensor:", sensorId);

  if (!validSensors.includes(sensorId.toLowerCase())) {
    return res.status(400).json({ error: "Invalid sensor ID." });
  }

  try {
    const table = sensorId.toLowerCase();
    const sql = `
      SELECT *
      FROM \`${table}\`
      ORDER BY \`timestamp\` DESC
      LIMIT 1
    `;
    const [rows] = await pool.query(sql);
    if (rows.length === 0) {
      return res.json({ data: null });
    }
    res.json({ data: rows[0] });
    console.log("Latest data:", rows[0]);
  } catch (err) {
    console.error("Error fetching latest sensor data:", err);
    res.status(500).json({ error: err.message });
  }
});

// NEW ENDPOINT: Get data for multiple sensors at once
app.get("/api/multi-sensor-data", async (req, res) => {
  const {
    timeRange = "week", // "day" | "week" | "month" | "year"
    paramName,
    paramType = "environment",
    sensorIds = "sensor1,sensor2", // Default to both sensors, comma-separated
  } = req.query;

  // ✅ Validate sensor IDs
  const validSensors = ["sensor1", "sensor2"];
  const requestedSensors = sensorIds
    .split(",")
    .filter((id) => validSensors.includes(id.trim().toLowerCase()));

  if (requestedSensors.length === 0) {
    return res.status(400).json({
      error: "No valid sensor IDs provided. Use sensor1 or sensor2.",
    });
  }

  // ✅ Determine exact time range in hours/days
  const rangeMap = {
    day: "INTERVAL 1 DAY",
    week: "INTERVAL 7 DAY",
    month: "INTERVAL 30 DAY",
    year: "INTERVAL 365 DAY",
  };

  const interval = rangeMap[timeRange] || rangeMap["week"];

  // ✅ Validate parameter
  const paramsByType = {
    environment: [
      "humidity",
      "temperature",
      "dht_humidity",
      "dht_temperature",
      "soil",
    ],
    nutrients: ["nitrogen", "phosphorus", "potassium", "conductivity", "ph"],
  };

  let columns = "*";
  if (paramName) {
    const validParams = paramsByType[paramType] || [];
    if (!validParams.includes(paramName)) {
      return res.status(400).json({
        error: `Invalid parameter "${paramName}" for type "${paramType}".`,
      });
    }
    columns = `id, timestamp, sensor_id, ${paramName}`;
  }

  try {
    // Process each sensor and collect results
    const results = {};

    for (const sensorId of requestedSensors) {
      const tableName = sensorId.toLowerCase();

      // Build SQL filter for this sensor
      const timeFilterSql = `
        timestamp >= DATE_SUB(
          (SELECT MAX(timestamp) FROM \`${tableName}\`),
          ${interval}
        )
      `;

      const sql = `
        SELECT ${columns}
        FROM \`${tableName}\`
        WHERE ${timeFilterSql}
        ORDER BY timestamp ASC
      `;

      const [rows] = await pool.query(sql);

      // Calculate stats if a parameter is specified
      let stats = { min: 0, max: 0, avg: 0, current: 0 };
      if (paramName && rows.length > 0) {
        const vals = rows
          .map((r) => parseFloat(r[paramName]))
          .filter((v) => !isNaN(v));

        if (vals.length) {
          stats = {
            min: Math.min(...vals),
            max: Math.max(...vals),
            avg: vals.reduce((s, v) => s + v, 0) / vals.length,
            current: vals[vals.length - 1],
          };
        }
      }

      // Store results for this sensor
      results[sensorId] = {
        data: rows,
        stats,
      };
    }

    // Check if we have any data
    const noData = Object.values(results).every(
      (result) => result.data.length === 0
    );

    if (noData) {
      return res.status(404).json({
        error: "No data found for any sensors with the given filters",
        timeRange,
        paramName: paramName || null,
        paramType,
        sensorIds: requestedSensors,
      });
    }

    res.json({
      results,
      timeRange,
      paramName: paramName || null,
      paramType,
      sensorIds: requestedSensors,
    });
  } catch (err) {
    console.error("Error fetching multi-sensor data:", err);
    res.status(500).json({
      error: "Database error",
      details: err.message,
    });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "client/build")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client/build", "index.html"));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
