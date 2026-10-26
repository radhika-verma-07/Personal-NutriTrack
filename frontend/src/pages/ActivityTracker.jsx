import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function ActivityTracker() {
  const navigate = useNavigate();

  const [activityType, setActivityType] = useState("");
  const [duration, setDuration] = useState("");

  const [activities, setActivities] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Get today's date
  const isToday = (date) => {
    const activityDate = new Date(date);
    const today = new Date();

    return (
      activityDate.getDate() === today.getDate() &&
      activityDate.getMonth() === today.getMonth() &&
      activityDate.getFullYear() === today.getFullYear()
    );
  };

  // Estimate calories burned
  const calculateCalories = (type, minutes) => {
    const caloriesPerMinute = {
      Walking: 4,
      Running: 10,
      Cycling: 8,
      Gym: 7,
      Yoga: 3,
      Swimming: 9,
      Dancing: 6,
      "Skipping Rope": 12,
      "Home Workout": 7,
      Other: 4,
    };

    const rate = caloriesPerMinute[type] || 4;

    return Math.round(rate * Number(minutes));
  };

  // Fetch activities from MongoDB
  const fetchActivities = async () => {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      setError("User profile not found. Please create your profile first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `https://personal-nutritrack-api.onrender.com/api/activities/user/${userId}`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load activities.");
      }

      setActivities(data.activities || []);
    } catch (error) {
      console.error(error);

      setError(error.message || "Unable to load activities.");
    } finally {
      setLoading(false);
    }
  };

  // Load activities when page opens
  useEffect(() => {
    fetchActivities();
  }, []);

  // Add activity
  const handleAddActivity = async (event) => {
    event.preventDefault();

    if (!activityType) {
      setError("Please select an activity.");
      return;
    }

    if (!duration || Number(duration) <= 0) {
      setError("Please enter a valid duration.");
      return;
    }

    const userId = localStorage.getItem("userId");

    if (!userId) {
      setError("User profile not found. Please create your profile first.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const estimatedCalories = calculateCalories(activityType, duration);

      const activityData = {
        userId: userId,

        activityType: activityType,

        duration: Number(duration),

        calories: estimatedCalories,

        date: new Date().toISOString(),
      };

      const response = await fetch(
        "https://personal-nutritrack-api.onrender.com/api/activities",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(activityData),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save activity.");
      }

      // Clear form
      setActivityType("");
      setDuration("");

      // Reload activities
      await fetchActivities();

      alert("Activity saved successfully!");
    } catch (error) {
      console.error(error);

      setError(error.message || "Unable to save activity.");
    } finally {
      setSaving(false);
    }
  };

  // Delete activity
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this activity?",
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(
        `https://personal-nutritrack-api.onrender.com/api/activities/${id}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete activity.");
      }

      await fetchActivities();
    } catch (error) {
      console.error(error);

      setError(error.message || "Unable to delete activity.");
    }
  };

  // Today's activities
  const todayActivities = activities.filter((activity) =>
    isToday(activity.date),
  );

  // Today's total minutes
  const todayMinutes = todayActivities.reduce(
    (total, activity) => total + (Number(activity.duration) || 0),
    0,
  );

  // Today's calories
  const todayCalories = todayActivities.reduce(
    (total, activity) => total + (Number(activity.calories) || 0),
    0,
  );

  return (
    <div className="activity-page">
      <div className="activity-container">
        {/* HEADER */}

        <div className="profile-heading">
          <p className="small-heading">ACTIVITY TRACKER</p>

          <h1>Track Your Physical Activity</h1>

          <p>
            Record your daily activities and monitor your movement, duration and
            estimated calories burned.
          </p>
        </div>

        {/* ACTIVITY FORM */}

        <div className="activity-card">
          <h2>Add Activity</h2>

          <form onSubmit={handleAddActivity}>
            <div className="form-group">
              <label>Activity Type</label>

              <select
                value={activityType}
                onChange={(event) => setActivityType(event.target.value)}
                required
              >
                <option value="">Select activity</option>

                <option value="Walking">Walking</option>

                <option value="Running">Running</option>

                <option value="Cycling">Cycling</option>

                <option value="Gym">Gym</option>

                <option value="Yoga">Yoga</option>

                <option value="Swimming">Swimming</option>

                <option value="Dancing">Dancing</option>

                <option value="Skipping Rope">Skipping Rope</option>

                <option value="Home Workout">Home Workout</option>

                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Duration (minutes)</label>

              <input
                type="number"
                min="1"
                max="1000"
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
                placeholder="Enter duration"
                required
              />
            </div>

            {error && <div className="food-error">{error}</div>}

            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? "Saving..." : "➕ Add Activity"}
            </button>
          </form>
        </div>

        {/* TODAY'S SUMMARY */}

        <div className="activity-summary">
          <div className="activity-summary-card">
            <span>Today's Activities</span>

            <strong>{todayActivities.length}</strong>
          </div>

          <div className="activity-summary-card">
            <span>Total Minutes</span>

            <strong>{todayMinutes}</strong>

            <small>minutes</small>
          </div>

          <div className="activity-summary-card">
            <span>Calories Burned</span>

            <strong>{todayCalories}</strong>

            <small>kcal</small>
          </div>
        </div>

        {/* ACTIVITY HISTORY */}

        <div className="activity-card">
          <div className="section-heading">
            <h2>Activity History</h2>

            <p>Your recorded physical activities</p>
          </div>

          {loading ? (
            <p>Loading activities...</p>
          ) : activities.length === 0 ? (
            <div className="empty-state">
              <h3>No activities yet</h3>

              <p>
                Add your first activity to start tracking your physical
                activity.
              </p>
            </div>
          ) : (
            <div className="activity-list">
              {activities.map((activity) => (
                <div className="activity-item" key={activity._id}>
                  <div>
                    <h3>{activity.activityType}</h3>

                    <p>{new Date(activity.date).toLocaleDateString()}</p>
                  </div>

                  <div className="activity-details">
                    <span>⏱️ {activity.duration} min</span>

                    <span>🔥 {activity.calories} kcal</span>
                  </div>

                  <button
                    className="delete-button"
                    onClick={() => handleDelete(activity._id)}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* NAVIGATION */}

        <div className="activity-navigation">
          <button
            className="secondary-button"
            onClick={() => navigate("/dashboard")}
          >
            📊 Dashboard
          </button>

          <button
            className="secondary-button"
            onClick={() => navigate("/weekly")}
          >
            📅 Weekly Analysis
          </button>
        </div>
      </div>
    </div>
  );
}

export default ActivityTracker;
