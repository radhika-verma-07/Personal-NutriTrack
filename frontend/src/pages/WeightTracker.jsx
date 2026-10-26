import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function WeightTracker() {
  const navigate = useNavigate();

  const [weight, setWeight] = useState("");
  const [weights, setWeights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  const userId = localStorage.getItem("userId");

  // --------------------------------------------------
  // LOAD WEIGHT HISTORY
  // --------------------------------------------------

  const loadWeights = async () => {
    if (!userId) {
      setError("User profile not found. Please create your profile first.");
      setFetching(false);
      return;
    }

    try {
      setFetching(true);
      setError("");

      const response = await fetch(
        `https://personal-nutritrack-api.onrender.com/api/weights/user/${userId}`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load weight history.");
      }

      const sortedWeights = (data.weights || []).sort(
        (a, b) => new Date(b.date) - new Date(a.date),
      );

      setWeights(sortedWeights);
    } catch (error) {
      console.error("Weight loading error:", error);

      setError(error.message || "Unable to load weight history.");
    } finally {
      setFetching(false);
    }
  };

  // --------------------------------------------------
  // LOAD DATA WHEN PAGE OPENS
  // --------------------------------------------------

  useEffect(() => {
    loadWeights();
  }, []);

  // --------------------------------------------------
  // SAVE NEW WEIGHT
  // --------------------------------------------------

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!userId) {
      setError("User profile not found. Please create your profile first.");
      return;
    }

    if (!weight) {
      setError("Please enter your weight.");
      return;
    }

    const weightValue = Number(weight);

    if (weightValue < 10 || weightValue > 300) {
      setError("Please enter a valid weight between 10 and 300 kg.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "https://personal-nutritrack-api.onrender.com/api/weights",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            userId: userId,
            weight: weightValue,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save weight.");
      }

      // Clear input
      setWeight("");

      // Reload weight history
      await loadWeights();

      alert("Weight saved successfully!");
    } catch (error) {
      console.error("Weight save error:", error);

      setError(error.message || "Unable to save weight.");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // DELETE WEIGHT RECORD
  // --------------------------------------------------

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this weight record?",
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `https://personal-nutritrack-api.onrender.com/api/weights/${id}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete weight record.");
      }

      await loadWeights();
    } catch (error) {
      console.error("Weight delete error:", error);

      setError(error.message || "Unable to delete weight record.");
    }
  };

  // --------------------------------------------------
  // GET LATEST WEIGHT
  // --------------------------------------------------

  const latestWeight = weights.length > 0 ? weights[0].weight : null;

  // --------------------------------------------------
  // GET PREVIOUS WEIGHT
  // --------------------------------------------------

  const previousWeight = weights.length > 1 ? weights[1].weight : null;

  // --------------------------------------------------
  // CALCULATE CHANGE
  // --------------------------------------------------

  let weightChange = null;

  if (latestWeight !== null && previousWeight !== null) {
    weightChange = Number(latestWeight) - Number(previousWeight);
  }

  // --------------------------------------------------
  // FORMAT DATE
  // --------------------------------------------------

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  return (
    <div className="weight-page">
      <div className="weight-container">
        {/* HEADER */}

        <div className="profile-heading">
          <p className="small-heading">WEIGHT TRACKER</p>

          <h1>Track Your Weight</h1>

          <p>
            Record your weight regularly to monitor your progress over time.
          </p>
        </div>

        {/* ERROR */}

        {error && <div className="food-error">{error}</div>}

        {/* CURRENT WEIGHT CARD */}

        <div className="weight-summary-card">
          <div>
            <span className="summary-label">Current Weight</span>

            <h2>{latestWeight !== null ? `${latestWeight} kg` : "--"}</h2>
          </div>

          <div>
            <span className="summary-label">Records</span>

            <h2>{weights.length}</h2>
          </div>

          {weightChange !== null && (
            <div>
              <span className="summary-label">Change</span>

              <h2>
                {weightChange > 0
                  ? `+${weightChange.toFixed(1)} kg`
                  : `${weightChange.toFixed(1)} kg`}
              </h2>
            </div>
          )}
        </div>

        {/* ADD WEIGHT */}

        <div className="weight-card">
          <div className="section-heading">
            <h2>Add New Weight</h2>

            <p>Enter your latest weight measurement.</p>
          </div>

          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label>Weight (kg)</label>

              <input
                type="number"
                value={weight}
                onChange={(event) => setWeight(event.target.value)}
                placeholder="Enter weight in kg"
                min="10"
                max="300"
                step="0.1"
                required
              />
            </div>

            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? "Saving..." : "Save Weight"}
            </button>
          </form>
        </div>

        {/* WEIGHT HISTORY */}

        <div className="weight-card">
          <div className="section-heading">
            <h2>Weight History</h2>

            <p>Your previous weight records.</p>
          </div>

          {fetching ? (
            <p>Loading weight history...</p>
          ) : weights.length === 0 ? (
            <div className="empty-state">
              <h3>No weight records yet</h3>

              <p>
                Add your first weight above to start tracking your progress.
              </p>
            </div>
          ) : (
            <div className="weight-history">
              {weights.map((record) => (
                <div className="weight-history-item" key={record._id}>
                  <div>
                    <strong>{record.weight} kg</strong>

                    <p>{formatDate(record.date)}</p>
                  </div>

                  <button
                    className="delete-button"
                    onClick={() => handleDelete(record._id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* NAVIGATION */}

        <div className="weight-navigation">
          <button
            className="secondary-button"
            onClick={() => navigate("/dashboard")}
          >
            ← Dashboard
          </button>

          <button
            className="secondary-button"
            onClick={() => navigate("/weekly")}
          >
            Weekly Analysis →
          </button>
        </div>

        {/* INFORMATION */}

        <div className="ai-disclaimer">
          <strong>Important:</strong> Weight records are based on the
          measurements you enter. The system does not automatically guess or
          calculate your actual weight from food or activity data.
        </div>
      </div>
    </div>
  );
}

export default WeightTracker;
