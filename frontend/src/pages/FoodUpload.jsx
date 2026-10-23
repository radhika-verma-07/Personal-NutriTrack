import { useState } from "react";
import { useNavigate } from "react-router-dom";

const COMMON_FOODS = [
  "Roti",
  "Rice",
  "Dal",
  "Paneer",
  "Salad",
  "Banana",
  "Apple",
  "Egg",
  "Chicken",
  "Poha",
  "Idli",
  "Dosa",
  "Paratha",
  "Rajma",
  "Chole",
  "Curd",
  "Oats",
  "Milk",
  "Khichdi",
  "Sandwich",
  "Other",
];

function FoodUpload() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("photo");

  const [imagePreview, setImagePreview] = useState("");
  const [imageData, setImageData] = useState("");
  const [mealType, setMealType] = useState("");

  const [analysis, setAnalysis] = useState(null);

  const [manualFood, setManualFood] = useState("");
  const [customFood, setCustomFood] = useState("");
  const [servingSize, setServingSize] = useState("1 serving");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const resetResult = () => {
    setAnalysis(null);
    setError("");
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    resetResult();
  };

  // =========================
  // PHOTO SELECTION
  // =========================

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    resetResult();

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      setImagePreview(reader.result);
      setImageData(reader.result);
    };

    reader.onerror = () => {
      setError("Unable to read this image. Please try another.");
    };

    reader.readAsDataURL(file);
  };

  // =========================
  // ANALYZE PHOTO WITH GEMINI
  // =========================

  const handleAnalyze = async () => {
    if (!imageData) {
      setError("Please upload a food image first.");
      return;
    }

    setLoading(true);
    resetResult();

    try {
      const response = await fetch("http://localhost:5000/api/analyze-food", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: imageData }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Food analysis failed.");
      }

      setAnalysis(data.result);
    } catch (err) {
      setError(err.message || "Unable to analyze the image.");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // ESTIMATE MANUAL FOOD
  // =========================

  const handleManualEstimate = async () => {
    const foodName = manualFood === "Other" ? customFood.trim() : manualFood;

    if (!foodName) {
      setError("Please select a food or enter its name.");
      return;
    }

    if (!servingSize.trim()) {
      setError("Please enter the quantity or serving size.");
      return;
    }

    setLoading(true);
    resetResult();

    try {
      const response = await fetch("http://localhost:5000/api/estimate-food", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          foodName,
          servingSize: servingSize.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to estimate nutrition.");
      }

      setAnalysis({
        ...data.result,
        description:
          data.result.description ||
          "AI-estimated nutrition. Actual values may vary.",
      });
    } catch (err) {
      setError(
        err.message || "Unable to estimate nutrition. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // SAVE TO FOOD VAULT
  // =========================

  const handleSaveFood = async () => {
    if (!analysis) {
      setError("Please analyze or estimate your food first.");
      return;
    }

    const userId = localStorage.getItem("userId");

    if (!userId) {
      setError("Please log in or create your profile first.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        userId,
        foodName: analysis.foodName || "Unknown Food",
        description:
          mode === "manual"
            ? `Manually entered food. ${analysis.description || "Nutrition is estimated."}`
            : analysis.description || "",
        servingSize: analysis.servingSize || "",
        mealType: mealType || "Other",
        calories: Number(analysis.calories) || 0,
        protein: Number(analysis.protein) || 0,
        carbs: Number(analysis.carbs) || 0,
        fat: Number(analysis.fat) || 0,
        confidence: Number(analysis.confidence) || 0,
        image: mode === "photo" ? imageData : "",
      };

      const response = await fetch("http://localhost:5000/api/foods", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save food.");
      }

      alert("Food saved successfully to your Food Vault!");
      navigate("/food-vault");
    } catch (err) {
      setError(err.message || "Unable to save food.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="food-upload-page">
      <div className="food-upload-container">
        <div className="food-upload-header">
          <p className="small-heading">FOOD ANALYZER</p>
          <h1>Log Your Food</h1>
          <p>Upload a meal photo or enter your food manually.</p>
        </div>

        {error && (
          <div className="food-error" role="alert">
            {error}
          </div>
        )}

        {/* METHOD SELECTOR */}

        <div className="food-upload-card">
          <div className="section-heading">
            <h2>How would you like to add your meal?</h2>
          </div>

          <div className="food-method-buttons">
            <button
              type="button"
              className={
                mode === "photo"
                  ? "food-method-button active"
                  : "food-method-button"
              }
              onClick={() => handleModeChange("photo")}
            >
              📷 Analyze Photo
            </button>

            <button
              type="button"
              className={
                mode === "manual"
                  ? "food-method-button active"
                  : "food-method-button"
              }
              onClick={() => handleModeChange("manual")}
            >
              📝 Add Manually
            </button>
          </div>

          {/* PHOTO MODE */}

          {mode === "photo" && (
            <>
              <div className="section-heading">
                <h2>Upload Food Image</h2>
                <p>Choose a clear picture of your meal for AI analysis.</p>
              </div>

              {!imagePreview ? (
                <label className="food-drop-zone">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  <div className="upload-icon">📷</div>
                  <h3>Choose a food image</h3>
                  <p>Click here to upload</p>
                  <span>JPG, PNG or WEBP</span>
                </label>
              ) : (
                <div className="food-preview-wrapper">
                  <div className="food-preview-box">
                    <img
                      src={imagePreview}
                      alt="Selected food"
                      className="food-upload-preview"
                    />
                  </div>

                  <label className="change-image-button">
                    Change Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
              )}

              <div className="food-form-group">
                <label htmlFor="photoMealType">Meal Type</label>
                <select
                  id="photoMealType"
                  value={mealType}
                  onChange={(event) => setMealType(event.target.value)}
                >
                  <option value="">Select meal type</option>
                  <option value="Breakfast">Breakfast</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Dinner">Dinner</option>
                  <option value="Snack">Snack</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <button
                type="button"
                className="food-analyze-button"
                onClick={handleAnalyze}
                disabled={!imageData || loading}
              >
                {loading ? "Analyzing..." : "✨ Analyze Food"}
              </button>
            </>
          )}

          {/* MANUAL MODE */}

          {mode === "manual" && (
            <div className="manual-food-form">
              <div className="section-heading">
                <h2>Add Food Without a Photo</h2>
                <p>
                  Select a food, enter the quantity, and estimate its nutrition.
                </p>
              </div>

              <div className="food-form-group">
                <label htmlFor="manualFood">Choose Food</label>

                <select
                  id="manualFood"
                  value={manualFood}
                  onChange={(event) => {
                    setManualFood(event.target.value);
                    setAnalysis(null);
                    setError("");
                  }}
                >
                  <option value="">Select a food</option>

                  {COMMON_FOODS.map((food) => (
                    <option key={food} value={food}>
                      {food}
                    </option>
                  ))}
                </select>
              </div>

              {manualFood === "Other" && (
                <div className="food-form-group">
                  <label htmlFor="customFood">Enter Your Food Name</label>

                  <input
                    id="customFood"
                    type="text"
                    placeholder="e.g. homemade rajma chawal"
                    value={customFood}
                    onChange={(event) => {
                      setCustomFood(event.target.value);
                      setAnalysis(null);
                    }}
                    maxLength={150}
                  />
                </div>
              )}

              <div className="food-form-group">
                <label htmlFor="servingSize">Quantity / Serving Size</label>

                <input
                  id="servingSize"
                  type="text"
                  placeholder="e.g. 2 rotis, 1 bowl, 150 g"
                  value={servingSize}
                  onChange={(event) => {
                    setServingSize(event.target.value);
                    setAnalysis(null);
                  }}
                  maxLength={100}
                />

                <small>
                  Be as specific as possible. Nutrition estimates depend on
                  portion size and preparation.
                </small>
              </div>

              <div className="food-form-group">
                <label htmlFor="manualMealType">Meal Type</label>

                <select
                  id="manualMealType"
                  value={mealType}
                  onChange={(event) => setMealType(event.target.value)}
                >
                  <option value="">Select meal type</option>
                  <option value="Breakfast">Breakfast</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Dinner">Dinner</option>
                  <option value="Snack">Snack</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <button
                type="button"
                className="food-analyze-button"
                onClick={handleManualEstimate}
                disabled={loading}
              >
                {loading ? "Estimating Nutrition..." : "✨ Estimate Nutrition"}
              </button>
            </div>
          )}
        </div>

        {/* ANALYSIS RESULT */}

        {analysis && (
          <div className="food-analysis-card">
            <div className="analysis-header">
              <div>
                <p className="small-heading">
                  {mode === "manual"
                    ? "MANUAL FOOD ESTIMATE"
                    : "AI PHOTO ANALYSIS"}
                </p>

                <h2>{analysis.foodName}</h2>
              </div>

              <div className="confidence-badge">
                {analysis.confidence || 0}% confidence
              </div>
            </div>

            <p className="food-description">{analysis.description}</p>

            <div className="serving-info">
              <span>Serving Size</span>
              <strong>{analysis.servingSize || servingSize}</strong>
            </div>

            <p>
              <strong>Estimated nutrition</strong>
              <br />
              <small>
                Actual values may vary with ingredients and preparation.
              </small>
            </p>

            <div className="nutrition-grid">
              <div className="nutrition-box">
                <span>Calories</span>
                <strong>{analysis.calories ?? 0}</strong>
                <small>kcal</small>
              </div>

              <div className="nutrition-box">
                <span>Protein</span>
                <strong>{analysis.protein ?? 0}</strong>
                <small>g</small>
              </div>

              <div className="nutrition-box">
                <span>Carbs</span>
                <strong>{analysis.carbs ?? 0}</strong>
                <small>g</small>
              </div>

              <div className="nutrition-box">
                <span>Fat</span>
                <strong>{analysis.fat ?? 0}</strong>
                <small>g</small>
              </div>
            </div>

            <button
              type="button"
              className="food-save-button"
              onClick={handleSaveFood}
              disabled={saving}
            >
              {saving ? "Saving..." : "💾 Save to Food Vault"}
            </button>
          </div>
        )}

        <div className="food-page-navigation">
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate("/dashboard")}
          >
            ← Dashboard
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate("/food-vault")}
          >
            My Food Vault →
          </button>
        </div>
      </div>
    </div>
  );
}

export default FoodUpload;
