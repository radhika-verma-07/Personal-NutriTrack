import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function FoodVault() {
  const navigate = useNavigate();

  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userId = localStorage.getItem("userId");

  /* =========================
     LOAD FOODS
  ========================= */

  const loadFoods = async () => {
    if (!userId) {
      setError("Please create your profile first.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `https://personal-nutritrack-api.onrender.com/api/foods/user/${userId}`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load your food vault.");
      }

      setFoods(data.foods || []);
    } catch (error) {
      console.error("Food Vault error:", error);

      setError(error.message || "Unable to load food records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFoods();
  }, []);

  /* =========================
     DELETE FOOD
  ========================= */

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this food entry?",
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `https://personal-nutritrack-api.onrender.com/api/foods/${id}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete food.");
      }

      setFoods((previousFoods) =>
        previousFoods.filter((food) => food._id !== id),
      );
    } catch (error) {
      console.error("Delete food error:", error);

      setError(error.message || "Unable to delete food.");
    }
  };

  /* =========================
     DATE FORMAT
  ========================= */

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  /* =========================
     TIME FORMAT
  ========================= */

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  /* =========================
     TODAY'S FOODS
  ========================= */

  const isToday = (date) => {
    const foodDate = new Date(date);
    const today = new Date();

    return (
      foodDate.getDate() === today.getDate() &&
      foodDate.getMonth() === today.getMonth() &&
      foodDate.getFullYear() === today.getFullYear()
    );
  };

  const todayFoods = foods.filter((food) => isToday(food.date));

  /* =========================
     TOTALS
  ========================= */

  const totalCalories = todayFoods.reduce(
    (total, food) => total + (Number(food.calories) || 0),
    0,
  );

  const totalProtein = todayFoods.reduce(
    (total, food) => total + (Number(food.protein) || 0),
    0,
  );

  return (
    <div className="food-vault-page">
      <div className="food-vault-container">
        {/* =========================
            HEADER
        ========================= */}

        <div className="food-vault-header">
          <div>
            <p className="small-heading">MY FOOD VAULT</p>

            <h1>Your Food Collection</h1>

            <p>Every meal you've analyzed and saved in one place.</p>
          </div>

          <button
            className="food-add-button"
            onClick={() => navigate("/food-upload")}
          >
            + Add Food
          </button>
        </div>

        {/* =========================
            ERROR
        ========================= */}

        {error && <div className="food-error">{error}</div>}

        {/* =========================
            SUMMARY
        ========================= */}

        {!loading && foods.length > 0 && (
          <div className="food-vault-summary">
            <div className="vault-summary-item">
              <span>Total Foods</span>

              <strong>{foods.length}</strong>
            </div>

            <div className="vault-summary-item">
              <span>Today's Meals</span>

              <strong>{todayFoods.length}</strong>
            </div>

            <div className="vault-summary-item">
              <span>Today's Calories</span>

              <strong>{Math.round(totalCalories)} kcal</strong>
            </div>

            <div className="vault-summary-item">
              <span>Today's Protein</span>

              <strong>{Math.round(totalProtein)} g</strong>
            </div>
          </div>
        )}

        {/* =========================
            LOADING
        ========================= */}

        {loading && (
          <div className="food-vault-loading">
            <div className="loading-circle"></div>

            <p>Loading your Food Vault...</p>
          </div>
        )}

        {/* =========================
            EMPTY
        ========================= */}

        {!loading && foods.length === 0 && !error && (
          <div className="food-empty-state">
            <div className="empty-food-icon">🍽️</div>

            <h2>Your Food Vault is Empty</h2>

            <p>Upload your first meal and let AI analyze its nutrition.</p>

            <button
              className="food-analyze-button"
              onClick={() => navigate("/food-upload")}
            >
              ✨ Analyze Your First Meal
            </button>
          </div>
        )}

        {/* =========================
            FOOD GRID
        ========================= */}

        {!loading && foods.length > 0 && (
          <div className="food-vault-grid">
            {foods.map((food) => (
              <div className="food-vault-card" key={food._id}>
                {/* IMAGE */}

                <div className="food-card-image-wrapper">
                  {food.image ? (
                    <img
                      src={food.image}
                      alt={food.foodName}
                      className="food-card-image"
                    />
                  ) : (
                    <div className="food-card-no-image">🍽️</div>
                  )}

                  <span className="meal-badge">{food.mealType || "Other"}</span>
                </div>

                {/* CONTENT */}

                <div className="food-card-content">
                  <div className="food-card-title-row">
                    <h2>{food.foodName}</h2>

                    {food.confidence > 0 && (
                      <span className="food-confidence">
                        {Math.round(food.confidence)}%
                      </span>
                    )}
                  </div>

                  {food.description && (
                    <p className="food-card-description">{food.description}</p>
                  )}

                  <div className="food-serving">
                    <span>Serving</span>

                    <strong>{food.servingSize || "Estimated"}</strong>
                  </div>

                  {/* NUTRITION */}

                  <div className="food-nutrition-row">
                    <div>
                      <strong>{Math.round(food.calories || 0)}</strong>

                      <span>kcal</span>
                    </div>

                    <div>
                      <strong>{Math.round(food.protein || 0)}</strong>

                      <span>protein</span>
                    </div>

                    <div>
                      <strong>{Math.round(food.carbs || 0)}</strong>

                      <span>carbs</span>
                    </div>

                    <div>
                      <strong>{Math.round(food.fat || 0)}</strong>

                      <span>fat</span>
                    </div>
                  </div>

                  {/* DATE */}

                  <div className="food-card-footer">
                    <div>
                      <span>{formatDate(food.date)}</span>

                      <small>{formatTime(food.date)}</small>
                    </div>

                    <button
                      className="food-delete-button"
                      onClick={() => handleDelete(food._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* =========================
            NAVIGATION
        ========================= */}

        <div className="food-page-navigation">
          <button
            className="secondary-button"
            onClick={() => navigate("/dashboard")}
          >
            ← Dashboard
          </button>

          <button
            className="secondary-button"
            onClick={() => navigate("/food-upload")}
          >
            Analyze New Food →
          </button>
        </div>

        {/* =========================
            DISCLAIMER
        ========================= */}

        <div className="ai-disclaimer">
          <strong>Note:</strong> Nutrition values are AI-based estimates and may
          vary depending on portion size and preparation.
        </div>
      </div>
    </div>
  );
}

export default FoodVault;
