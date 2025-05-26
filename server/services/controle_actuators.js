// routes/dataRouter.js
const express = require("express");
const router = express.Router();
const { applyActuatorLogic } = require("./actuatorLogic");
router.post("/process", (req, res) => {
  const { mergedData } = req.body;
  console.log("Received data:", mergedData);

  const result = applyActuatorLogic(mergedData);
  console.log("Processed data:", result);
  res.json({ success: true, actuators: result });
});

module.exports = router;
