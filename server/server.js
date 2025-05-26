// server.js - Firebase version using Realtime Database
const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const ort = require("onnxruntime-node");
const sharp = require("sharp");
const axios = require("axios");
const fs = require("fs");

require("dotenv").config();
const aiRoute = require("./services/ai");
const actuatorsControl = require("./services/controle_actuators");

const app = express();
const PORT = process.env.PORT || 5000;
const upload = multer({ storage: multer.memoryStorage() });
let session;

// Load the ONNX model once at startup
ort.InferenceSession.create(path.join(__dirname, "models", "best.onnx"))
  .then((s) => {
    session = s;
  })
  .catch(console.error);

app.use(cors());
app.use(express.json());

// Firebase Admin Initialization
const serviceAccount = require("../grassthink-47000-firebase-adminsdk-fbsvc-1a39f3a722.json");

let firebaseConfig;
if (process.env.FIREBASE_CONFIG) {
  firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
  console.log("Using Firebase config from environment variable");
} else {
  firebaseConfig = require("../grassthink-47000-firebase-adminsdk-fbsvc-1a39f3a722.json");
}

admin.initializeApp({
  credential: admin.credential.cert(firebaseConfig),
  databaseURL:
    process.env.FIREBASE_DATABASE_URL ||
    "https://grassthink-47000-default-rtdb.firebaseio.com",
});
const db = admin.database();

// Helper: Get sensor reference
const getSensorRef = (sensorId) => {
  if (sensorId !== "sensor1" && sensorId !== "sensor2") return null;
  return db.ref(sensorId);
};

app.post("/api/classify", upload.single("leaf"), async (req, res) => {
  try {
    // 1. Preprocess buffer → 640×640 RGB tensor
    const imgBuffer = await sharp(req.file.buffer)
      .resize(640, 640)
      .raw()
      .toBuffer(); // returns H×W×C uint8

    // Normalize to [0,1] float32
    const floatData = Float32Array.from(imgBuffer, (v) => v / 255.0);

    // HWC → CHW
    const numPixels = 640 * 640;
    const chwData = new Float32Array(3 * numPixels);
    for (let i = 0; i < numPixels; i++) {
      chwData[i] = floatData[i * 3 + 0]; // R
      chwData[i + numPixels] = floatData[i * 3 + 1]; // G
      chwData[i + 2 * numPixels] = floatData[i * 3 + 2]; // B
    }

    const inputTensor = new ort.Tensor("float32", chwData, [1, 3, 640, 640]);
    console.log("Input tensor dims:", inputTensor.dims);

    // 2. Prepare feeds using actual model input name
    const inputName = session.inputNames[0];
    const feeds = { [inputName]: inputTensor };

    // 3. Run inference
    const outputMap = await session.run(feeds);

    // 4. Grab logits using actual output name
    const outputName = session.outputNames[0];
    const logits = outputMap[outputName].data;

    // 5. Argmax → class
    const classes = ["-K", "-N", "-P", "FN"];
    let maxIdx = 0,
      maxVal = -Infinity;
    logits.forEach((v, i) => {
      if (v > maxVal) {
        maxVal = v;
        maxIdx = i;
      }
    });

    const predicted = classes[maxIdx];
    const confidence = maxVal;
    console.log(`Predicted: ${predicted} (conf=${confidence.toFixed(4)})`);

    return res.json({ class: predicted, confidence });
  } catch (err) {
    console.error("Classification error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// GET filtered sensor data
app.get("/api/sensor-data/:sensorId", async (req, res) => {
  const { sensorId } = req.params;
  const {
    timeRange = "week",
    paramName,
    paramType = "environment",
  } = req.query;

  const sensorRef = getSensorRef(sensorId);
  if (!sensorRef) return res.status(400).json({ error: "Invalid sensor ID" });

  const rangeMap = {
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
    year: 365 * 24 * 60 * 60 * 1000,
  };

  const duration = rangeMap[timeRange] || rangeMap.week;
  const now = Date.now();
  const cutoff = now - duration;

  try {
    // Query data from the specified time range
    const snapshot = await sensorRef
      .orderByChild("timestamp")
      .startAt(cutoff)
      .once("value");

    const rows = [];
    snapshot.forEach((childSnapshot) => {
      rows.push(childSnapshot.val());
    });

    // Sort by timestamp ascending
    rows.sort((a, b) => a.timestamp - b.timestamp);

    let stats = { min: 0, max: 0, avg: 0, current: 0 };

    if (paramName && rows.length > 0) {
      const vals = rows
        .map((r) => parseFloat(r[paramName]))
        .filter((v) => !isNaN(v));

      if (vals.length) {
        stats = {
          min: Math.min(...vals),
          max: Math.max(...vals),
          avg: vals.reduce((a, b) => a + b, 0) / vals.length,
          current: vals[vals.length - 1],
        };
      }
    }

    res.json({ data: rows, stats, timeRange, paramName, paramType, sensorId });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Database query failed", details: err.message });
  }
});

// GET latest sensor data
app.get("/api/sensor-data-latest/:sensorId", async (req, res) => {
  const { sensorId } = req.params;
  const sensorRef = getSensorRef(sensorId);
  if (!sensorRef) return res.status(400).json({ error: "Invalid sensor ID" });

  try {
    const snapshot = await sensorRef
      .orderByChild("timestamp")
      .limitToLast(1)
      .once("value");

    if (snapshot.numChildren() === 0) return res.json({ data: null });

    let data = null;
    snapshot.forEach((childSnapshot) => {
      data = childSnapshot.val();
    });

    res.json({ data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Multi-sensor query
app.get("/api/multi-sensor-data", async (req, res) => {
  const {
    timeRange = "week",
    paramName,
    paramType = "environment",
    sensorIds = "sensor1,sensor2",
  } = req.query;

  const validSensors = ["sensor1", "sensor2"];
  const requestedSensors = sensorIds
    .split(",")
    .map((s) => s.trim())
    .filter((s) => validSensors.includes(s));

  if (!requestedSensors.length) {
    return res.status(400).json({ error: "No valid sensor IDs" });
  }

  const rangeMap = {
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
    year: 365 * 24 * 60 * 60 * 1000,
  };

  const duration = rangeMap[timeRange] || rangeMap.week;
  const cutoff = Date.now() - duration;

  const results = {};

  try {
    for (const sensorId of requestedSensors) {
      const sensorRef = getSensorRef(sensorId);
      const snapshot = await sensorRef
        .orderByChild("timestamp")
        .startAt(cutoff)
        .once("value");

      const rows = [];
      snapshot.forEach((childSnapshot) => {
        rows.push(childSnapshot.val());
      });

      // Sort by timestamp ascending
      rows.sort((a, b) => a.timestamp - b.timestamp);

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

      results[sensorId] = { data: rows, stats };
    }

    res.json({
      results,
      timeRange,
      paramName,
      paramType,
      sensorIds: requestedSensors,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

app.get("/api/weather", async (req, res) => {
  const { lat, lon } = req.query;
  const apiKey =
    process.env.WEATHER_API_KEY || "cc3d4e7f14ec4f0cba0153348252305";

  if (!lat || !lon) {
    return res.status(400).json({ error: "Missing lat or lon" });
  }

  try {
    const weatherUrl = `http://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${lat},${lon}&aqi=no`;
    if (weatherUrl) {
      // console.log("Weather API URL:", weatherUrl);
    }
    const response = await axios.get(weatherUrl);
    res.json(response.data);
  } catch (err) {
    console.error("Weather API error:", err.message);
    res.status(500).json({ error: "Weather API request failed" });
  }
});

async function fetchAndSaveWeatherHistory() {
  const apiKey = "cc3d4e7f14ec4f0cba0153348252305";
  const lat = "36.6642006";
  const lon = "4.9131258";
  const filePath = path.join(__dirname, "history.json");

  // Load existing data or initialize empty object
  let history = {};
  if (fs.existsSync(filePath)) {
    try {
      history = JSON.parse(fs.readFileSync(filePath));
    } catch (err) {
      console.warn("Failed to parse history.json, starting fresh.");
      history = {};
    }
  }

  // Generate all dates between start and end
  const startDate = new Date("2025-01-28");
  const endDate = new Date("2025-02-24");

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];

    // Skip if already fetched
    if (history[dateStr]) {
      console.log(`Skipping ${dateStr} (already exists)`);
      continue;
    }

    const url = `http://api.weatherapi.com/v1/history.json?key=${apiKey}&q=${lat},${lon}&dt=${dateStr}`;

    try {
      const response = await axios.get(url);
      const hourlyData = response.data.forecast.forecastday[0].hour;

      // Save only hourly data keyed by date
      history[dateStr] = hourlyData;
      // console.log(`Fetched ${dateStr}`);
    } catch (err) {
      console.error(`Failed for ${dateStr}:`, err.message);
    }

    // Optional: Wait between requests to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  fs.writeFileSync(filePath, JSON.stringify(history, null, 2));
  console.log(`All data saved to ${filePath}`);
}

app.get("/api/save-weather-history", async (req, res) => {
  try {
    await fetchAndSaveWeatherHistory();
    res.json({ message: "Weather history updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch weather history" });
  }
});

// async function fetchAndSaveWeatherHistory() {
//   const apiKey = "cc3d4e7f14ec4f0cba0153348252305"; // Use env var for production
//   const lat = "36.6642006";
//   const lon = "4.9131258";
//   const date = "2025-02-18"; // Change this dynamically if needed
//   const url = `http://api.weatherapi.com/v1/history.json?key=${apiKey}&q=${lat},${lon}&dt=${date}`;

//   const filePath = path.resolve("./history.json");

//   try {
//     const response = await axios.get(url);
//     const newData = response.data;

//     let existingData = [];

//     if (fs.existsSync(filePath)) {
//       const fileContent = fs.readFileSync(filePath, "utf8");
//       existingData = JSON.parse(fileContent);
//     }

//     // Ensure data is in array format
//     if (!Array.isArray(existingData)) {
//       existingData = [existingData];
//     }

//     // Remove existing entry for the same date if present
//     const filteredData = existingData.filter(
//       (entry) =>
//         entry.forecast?.forecastday?.[0]?.date !==
//         newData.forecast?.forecastday?.[0]?.date
//     );

//     // Add the new data
//     filteredData.push(newData);

//     // Sort by date ascending
//     filteredData.sort((a, b) => {
//       const dateA = new Date(a.forecast?.forecastday?.[0]?.date);
//       const dateB = new Date(b.forecast?.forecastday?.[0]?.date);
//       return dateA - dateB;
//     });

//     fs.writeFileSync(filePath, JSON.stringify(filteredData, null, 2));
//     console.log(`Weather data updated in ${filePath}`);
//   } catch (error) {
//     console.error("Error fetching or saving weather data:", error.message);
//   }
// }

// app.get("/api/save-weather-history", async (req, res) => {
//   try {
//     await fetchAndSaveWeatherHistory();
//     res.json({ message: "Weather data saved successfully" });
//   } catch (err) {
//     res.status(500).json({ error: "Failed to save weather data" });
//   }
// });

app.use("/api/ai", aiRoute);
app.use("/api", actuatorsControl);

// Serve static frontend
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "client/build")));
  app.get("*", (req, res) =>
    res.sendFile(path.join(__dirname, "client/build", "index.html"))
  );
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
