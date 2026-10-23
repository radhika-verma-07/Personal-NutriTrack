const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const connectDB = require("./config/db");

const userRoutes = require("./routes/userRoutes");
const foodRoutes = require("./routes/foodRoutes");
const activityRoutes = require("./routes/activityRoutes");
const weightRoutes = require("./routes/weightRoutes");

dotenv.config();

const app = express();

const PORT = 5000;

/* =========================
   DATABASE CONNECTION
========================= */

connectDB();

/* =========================
   MIDDLEWARE
========================= */

app.use(cors());

app.use(
  express.json({
    limit: "10mb"
  })
);

/* =========================
   GEMINI AI SETUP
========================= */

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);

const model = genAI.getGenerativeModel({
  model: "gemini-3.5-flash-lite"
});

/* =========================
   HOME ROUTE
========================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Obesity Management backend is running"
  });
});

/* =========================
   MONGODB API ROUTES
========================= */

// User/Profile
app.use("/api/users", userRoutes);

// Food
app.use("/api/foods", foodRoutes);

// Activity
app.use("/api/activities", activityRoutes);

// Weight
app.use("/api/weights", weightRoutes);

/* =========================
   GEMINI FOOD ANALYSIS
========================= */

app.post("/api/analyze-food", async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        error: "Food image is required."
      });
    }

    /*
      image is received from React as:

      data:image/jpeg;base64,......

      We only need the Base64 part.
    */

    const base64Data = image.includes(",")
      ? image.split(",")[1]
      : image;

    /*
      Detect image type from the data URL.
    */

    let mimeType = "image/jpeg";

    if (image.startsWith("data:image/png")) {
      mimeType = "image/png";
    } else if (image.startsWith("data:image/webp")) {
      mimeType = "image/webp";
    } else if (image.startsWith("data:image/jpg")) {
      mimeType = "image/jpeg";
    } else if (image.startsWith("data:image/jpeg")) {
      mimeType = "image/jpeg";
    }

    const prompt = `
You are a food and nutrition analysis assistant.

Analyze the food shown in the image.

Return ONLY valid JSON.
Do not use markdown.
Do not use code fences.
Do not add any explanation outside the JSON.

Use exactly this structure:

{
  "foodName": "name of food",
  "description": "short description of the food",
  "servingSize": "estimated serving size",
  "calories": 0,
  "protein": 0,
  "carbs": 0,
  "fat": 0,
  "confidence": 0
}

Rules:

1. foodName:
   Identify the most likely food shown.

2. description:
   Give a short description.

3. servingSize:
   Give an estimated serving size such as "1 bowl", "2 pieces", "1 plate", etc.

4. calories:
   Estimate calories for the visible serving.

5. protein:
   Estimate protein in grams.

6. carbs:
   Estimate carbohydrates in grams.

7. fat:
   Estimate fat in grams.

8. confidence:
   Give your confidence as a number between 0 and 100.

If the exact food cannot be identified, provide your best reasonable estimate.

Do not include units inside numerical fields.
`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      },
      prompt
    ]);

    const response = await result.response;

    let text = response.text();

    /*
      Remove accidental markdown code fences
      if Gemini returns them.
    */

    text = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let foodData;

    try {
      foodData = JSON.parse(text);
    } catch (parseError) {
      console.error(
        "Gemini returned invalid JSON:",
        text
      );

      return res.status(500).json({
        success: false,
        error:
          "AI returned an invalid food analysis. Please try another image."
      });
    }

    /*
      Make sure numerical values are actually numbers.
    */

    foodData.calories =
      Number(foodData.calories) || 0;

    foodData.protein =
      Number(foodData.protein) || 0;

    foodData.carbs =
      Number(foodData.carbs) || 0;

    foodData.fat =
      Number(foodData.fat) || 0;

    foodData.confidence =
      Number(foodData.confidence) || 0;

    res.json({
      success: true,
      result: foodData
    });
  } catch (error) {
    console.error(
      "Gemini food analysis error:",
      error
    );

    /*
      Gemini may temporarily return 503
      when the model is unavailable or
      experiencing high demand.
    */

    if (
      error.message &&
      (
        error.message.includes("503") ||
        error.message.includes("UNAVAILABLE") ||
        error.message.includes("high demand")
      )
    ) {
      return res.status(503).json({
        success: false,
        error:
          "Gemini AI is temporarily unavailable. Please wait a few seconds and try again."
      });
    }

    res.status(500).json({
      success: false,
      error:
        error.message ||
        "Food analysis failed."
    });
  }
});

/* =========================
   MANUAL FOOD NUTRITION ESTIMATE
========================= */

app.post("/api/estimate-food", async (req, res) => {
  try {
    const { foodName, servingSize } = req.body;

    if (
      typeof foodName !== "string" ||
      !foodName.trim() ||
      typeof servingSize !== "string" ||
      !servingSize.trim()
    ) {
      return res.status(400).json({
        success: false,
        error: "Please enter a food name and serving size."
      });
    }

    const prompt = `
You are a food nutrition estimation assistant.

Estimate the nutrition of the following food and serving.

Food: ${foodName.trim()}
Serving size: ${servingSize.trim()}

Return ONLY valid JSON, without markdown or code fences, in this exact format:

{
  "foodName": "food name",
  "description": "short description stating that nutrition is estimated",
  "servingSize": "serving size",
  "calories": 0,
  "protein": 0,
  "carbs": 0,
  "fat": 0,
  "confidence": 0
}

Rules:
- Estimate nutrition for the specified serving, not 100 grams unless specified.
- Use reasonable typical values for the food and serving.
- For homemade or mixed dishes, values may vary by ingredients and preparation.
- All nutrition values must be non-negative numbers.
- Do not claim exact accuracy.
- Confidence must be a number from 0 to 100.
- Do not add any text outside the JSON.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    const text = response.text()
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let nutrition;

    try {
      nutrition = JSON.parse(text);
    } catch {
      return res.status(500).json({
        success: false,
        error: "AI returned an invalid nutrition estimate. Please try again."
      });
    }

    const numericFields = [
      "calories",
      "protein",
      "carbs",
      "fat",
      "confidence"
    ];

    for (const field of numericFields) {
      const value = Number(nutrition[field]);

      if (!Number.isFinite(value) || value < 0) {
        return res.status(500).json({
          success: false,
          error: "AI returned an invalid nutrition value. Please try again."
        });
      }

      nutrition[field] = value;
    }

    nutrition.confidence = Math.min(100, nutrition.confidence);

    res.json({
      success: true,
      result: nutrition
    });
  } catch (error) {
    console.error("Manual nutrition estimate error:", error);

    res.status(500).json({
      success: false,
      error: "Unable to estimate nutrition right now. Please try again."
    });
  }
});

/* =========================
   404 ROUTE
========================= */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "API route not found."
  });
});

/* =========================
   START SERVER
========================= */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});