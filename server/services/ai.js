// server/azureRoutes.js

const express = require("express");
const { AzureOpenAI } = require("openai");
require("dotenv").config();

const router = express.Router();

// Azure OpenAI configuration
const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const apiVersion = process.env.AZURE_OPENAI_API_VERSION;
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
const modelName = "gpt-4o-mini";

// Create OpenAI client with API key (no Azure AD in this version)
const client = new AzureOpenAI({
  endpoint,
  apiKey,
  apiVersion,
  deployment,
});

// POST /analyze
router.post("/analyze", async (req, res) => {
  const { classification } = req.body;

  const prompt = `
You are a smart agriculture assistant.

Detected nutrient deficiency classification: "${classification}".

Please do the following:

1. Based on the classification, return a list of AI insights describing symptoms or issues observed in the plant. Format the response as follows:

{
  "${classification}": [
    { "id": 1, "issue": "Describe the issue related to ${classification}", "severity": "low/medium/high" },
    ...
  ]
}

If the classification is "FN" (Full Nutrients), return:
{
  "FN": [
    { "id": 1, "issue": "No deficiency detected. Plant appears healthy.", "severity": "none" }
  ]
}

2. Provide a short summary analyzing the plant's health based on the classification.

3. Give a clear and simple recommendation to improve the plant's condition.

4. Suggest actions for each greenhouse device to address the issue:
- Fan
- Light
- Pump
- Roof

5. Return the following control object in **this exact JSON format**:
{
  "fan": true/false,
  "light": true/false,
  "pump": true/false,
  "roof": true/false
}

Respond strictly and ONLY in raw JSON format without any markdown, explanation, or code blocks.
`;

  try {
    const completion = await client.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
      temperature: 0.8,
      top_p: 1,
      model: modelName,
    });

    let content = completion.choices[0].message.content.trim();
    // Remove any code fences
    content = content.replace(/```json|```/g, "").trim();

    const json = JSON.parse(content);
    res.json(json);
  } catch (error) {
    console.error(
      "GPT Error:",
      error?.response?.data || error.message || error
    );
    res.status(500).json({ error: "Erreur lors de l’analyse GPT." });
  }
});

module.exports = router;
