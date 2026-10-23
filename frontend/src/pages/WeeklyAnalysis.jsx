import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function WeeklyAnalysis() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [foods, setFoods] = useState([]);
  const [activities, setActivities] = useState([]);
  const [weights, setWeights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userId = localStorage.getItem("userId");

  // =========================
  // LOAD ALL DATA
  // =========================

  useEffect(() => {
    let cancelled = false;

    const loadWeeklyData = async () => {
      if (!userId) {
        setError("Please create your profile first.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const requests = await Promise.all([
          fetch(`http://localhost:5000/api/users/${userId}`),
          fetch(`http://localhost:5000/api/foods/user/${userId}`),
          fetch(`http://localhost:5000/api/activities/user/${userId}`),
          fetch(`http://localhost:5000/api/weights/user/${userId}`),
        ]);

        const [
          profileResponse,
          foodResponse,
          activityResponse,
          weightResponse,
        ] = requests;

        const [profileData, foodData, activityData, weightData] =
          await Promise.all(
            requests.map(async (response) => {
              const data = await response.json();

              if (!response.ok) {
                throw new Error(data.error || "Failed to load weekly data.");
              }

              return data;
            }),
          );

        if (cancelled) return;

        setProfile(profileData.user || null);
        setFoods(foodData.foods || []);
        setActivities(activityData.activities || []);

        // Always put newest weight record first.
        const sortedWeights = [...(weightData.weights || [])].sort(
          (a, b) =>
            new Date(b.date || b.createdAt).getTime() -
            new Date(a.date || a.createdAt).getTime(),
        );

        setWeights(sortedWeights);
      } catch (err) {
        if (!cancelled) {
          console.error("Weekly analysis error:", err);
          setError(err.message || "Unable to load weekly analysis.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadWeeklyData();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // =========================
  // DATE HELPERS
  // =========================

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const getRecordDate = (record) => new Date(record.date || record.createdAt);

  const getPeriodRecords = (records, start, end) =>
    records.filter((record) => {
      const date = getRecordDate(record);

      return !Number.isNaN(date.getTime()) && date >= start && date < end;
    });

  // Use calendar-day periods.
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Current period: today and the previous six days.
  const currentWeekStart = new Date(todayStart);
  currentWeekStart.setDate(currentWeekStart.getDate() - 6);

  // Previous period: the seven calendar days before the current period.
  const previousWeekStart = new Date(todayStart);
  previousWeekStart.setDate(previousWeekStart.getDate() - 13);

  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const previousPeriodEnd = new Date(currentWeekStart);

  // =========================
  // CURRENT 7-DAY DATA
  // =========================

  const weeklyFoods = getPeriodRecords(foods, currentWeekStart, tomorrowStart);

  const weeklyActivities = getPeriodRecords(
    activities,
    currentWeekStart,
    tomorrowStart,
  );

  const weeklyWeights = getPeriodRecords(
    weights,
    currentWeekStart,
    tomorrowStart,
  ).sort((a, b) => getRecordDate(b) - getRecordDate(a));

  // =========================
  // WEEK-TO-WEEK COMPARISON
  // =========================

  const currentWeekFoods = weeklyFoods;

  const previousWeekFoods = getPeriodRecords(
    foods,
    previousWeekStart,
    previousPeriodEnd,
  );

  const currentWeekActivities = weeklyActivities;

  const previousWeekActivities = getPeriodRecords(
    activities,
    previousWeekStart,
    previousPeriodEnd,
  );

  const currentWeekWeights = weeklyWeights;

  const previousWeekWeights = getPeriodRecords(
    weights,
    previousWeekStart,
    previousPeriodEnd,
  ).sort((a, b) => getRecordDate(b) - getRecordDate(a));

  const getFoodStats = (records) => {
    const calories = records.reduce(
      (sum, food) => sum + (Number(food.calories) || 0),
      0,
    );

    const protein = records.reduce(
      (sum, food) => sum + (Number(food.protein) || 0),
      0,
    );

    const loggedDays = new Set(
      records.map((food) => getRecordDate(food).toDateString()),
    ).size;

    return {
      calories,
      protein,
      loggedDays,
      averageCalories:
        loggedDays > 0 ? Math.round(calories / loggedDays) : null,
      averageProtein:
        loggedDays > 0 ? Math.round((protein / loggedDays) * 10) / 10 : null,
    };
  };

  const currentFoodStats = getFoodStats(currentWeekFoods);
  const previousFoodStats = getFoodStats(previousWeekFoods);

  const getActivityStats = (records) => {
    const activeRecords = records.filter(
      (activity) => Number(activity.duration) > 0,
    );

    return {
      minutes: records.reduce(
        (sum, activity) => sum + (Number(activity.duration) || 0),
        0,
      ),
      days: new Set(
        activeRecords.map((activity) => getRecordDate(activity).toDateString()),
      ).size,
    };
  };

  const currentActivityStats = getActivityStats(currentWeekActivities);
  const previousActivityStats = getActivityStats(previousWeekActivities);

  const getPercentageChange = (current, previous) => {
    if (current == null || previous == null || previous === 0) {
      return null;
    }

    return Math.round(((current - previous) / Math.abs(previous)) * 100);
  };

  const formatChange = (current, previous) => {
    const change = getPercentageChange(current, previous);

    if (change === null) return "Not enough data";
    if (change === 0) return "No change";

    return `${change > 0 ? "+" : ""}${change}%`;
  };

  // Each variable is declared exactly once.
  const currentLatestWeight = currentWeekWeights[0] || null;
  const previousLatestWeight = previousWeekWeights[0] || null;

  const weightDifference =
    currentLatestWeight && previousLatestWeight
      ? Number(
          (
            Number(currentLatestWeight.weight) -
            Number(previousLatestWeight.weight)
          ).toFixed(1),
        )
      : null;

  const comparisonSummary =
    currentWeekFoods.length === 0 && previousWeekFoods.length === 0
      ? "Log meals during both periods to compare your nutrition trends."
      : currentFoodStats.averageCalories == null ||
          previousFoodStats.averageCalories == null
        ? "Keep logging meals in both weeks to unlock your calorie comparison."
        : currentFoodStats.averageCalories < previousFoodStats.averageCalories
          ? "Your average recorded calories per logged day decreased. Whether this is appropriate depends on your individual needs and goals."
          : currentFoodStats.averageCalories > previousFoodStats.averageCalories
            ? "Your average recorded calories per logged day increased. Consider this alongside your personal goals and activity."
            : "Your average recorded calories per logged day stayed the same.";

  // =========================
  // NUTRITION TOTALS
  // =========================

  const totalCalories = weeklyFoods.reduce(
    (sum, food) => sum + (Number(food.calories) || 0),
    0,
  );

  const totalProtein = weeklyFoods.reduce(
    (sum, food) => sum + (Number(food.protein) || 0),
    0,
  );

  const totalCarbs = weeklyFoods.reduce(
    (sum, food) => sum + (Number(food.carbs) || 0),
    0,
  );

  const totalFat = weeklyFoods.reduce(
    (sum, food) => sum + (Number(food.fat) || 0),
    0,
  );

  const averageCalories =
    weeklyFoods.length > 0 ? Math.round(totalCalories / 7) : 0;

  const averageProtein =
    weeklyFoods.length > 0 ? Math.round((totalProtein / 7) * 10) / 10 : 0;

  // =========================
  // ACTIVITY TOTALS
  // =========================

  const totalActivityMinutes = weeklyActivities.reduce(
    (sum, activity) => sum + (Number(activity.duration) || 0),
    0,
  );

  const totalActivityCalories = weeklyActivities.reduce(
    (sum, activity) => sum + (Number(activity.calories) || 0),
    0,
  );

  // =========================
  // DAILY CHART
  // =========================

  const last7Days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(todayStart);
    date.setDate(date.getDate() - (6 - index));

    const dayFoods = foods.filter(
      (food) => getRecordDate(food).toDateString() === date.toDateString(),
    );

    const dayActivities = activities.filter(
      (activity) =>
        getRecordDate(activity).toDateString() === date.toDateString(),
    );

    return {
      date,
      label: date.toLocaleDateString("en-IN", { weekday: "short" }),
      calories: dayFoods.reduce(
        (sum, food) => sum + (Number(food.calories) || 0),
        0,
      ),
      foodCount: dayFoods.length,
      activityMinutes: dayActivities.reduce(
        (sum, activity) => sum + (Number(activity.duration) || 0),
        0,
      ),
    };
  });

  const foodLoggingDays = last7Days.filter((day) => day.foodCount > 0).length;

  const activityDays = last7Days.filter(
    (day) => day.activityMinutes > 0,
  ).length;

  const uniqueFoods = new Set(
    weeklyFoods
      .map((food) =>
        String(food.foodName || "")
          .trim()
          .toLowerCase(),
      )
      .filter(Boolean),
  ).size;

  // This is a tracking score, not a medical score.
  const trackingScore = Math.round(
    (foodLoggingDays / 7) * 40 +
      (activityDays / 7) * 30 +
      (Math.min(uniqueFoods, 10) / 10) * 30,
  );

  // =========================
  // WEEKLY INSIGHTS
  // =========================

  const weeklyInsights = [];

  if (foodLoggingDays >= 5) {
    weeklyInsights.push(
      `Great consistency! You recorded meals on ${foodLoggingDays} of the last 7 days.`,
    );
  } else {
    weeklyInsights.push(
      "Try recording meals on more days to get a more complete weekly report.",
    );
  }

  if (activityDays >= 4) {
    weeklyInsights.push(
      `You recorded activity on ${activityDays} days this week. Keep building a sustainable routine.`,
    );
  } else {
    weeklyInsights.push(
      `You recorded activity on ${activityDays} days. Consider adding movement that comfortably fits your routine.`,
    );
  }

  if (uniqueFoods >= 5) {
    weeklyInsights.push(
      `You logged ${uniqueFoods} different foods. Continue aiming for variety.`,
    );
  } else if (weeklyFoods.length > 0) {
    weeklyInsights.push(
      "Try including a wider variety of foods across your meals.",
    );
  }

  if (weeklyFoods.length === 0) {
    weeklyInsights.push(
      "Add food entries to unlock more personalized nutrition observations.",
    );
  }

  // =========================
  // ACHIEVEMENTS
  // =========================

  const achievements = [
    {
      title: "Consistent Tracker",
      description: "Record meals on at least 5 different days.",
      unlocked: foodLoggingDays >= 5,
      icon: "📅",
    },
    {
      title: "Move More",
      description: "Record activity on at least 4 days.",
      unlocked: activityDays >= 4,
      icon: "🏃",
    },
    {
      title: "Food Explorer",
      description: "Log at least 5 different foods.",
      unlocked: uniqueFoods >= 5,
      icon: "🥗",
    },
  ];

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="weekly-page">
        <div className="weekly-container">
          <div className="profile-heading">
            <p className="small-heading">WEEKLY ANALYSIS</p>
            <h1>Loading your analysis...</h1>
            <p>
              Please wait while we collect your food, activity and weight data.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // NO USER
  // =========================

  if (!userId) {
    return (
      <div className="weekly-page">
        <div className="weekly-container">
          <div className="profile-heading">
            <p className="small-heading">WEEKLY ANALYSIS</p>
            <h1>Please create your profile first.</h1>
            <button
              className="primary-button"
              onClick={() => navigate("/profile")}
            >
              Create Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // PAGE
  // =========================

  return (
    <div className="weekly-page">
      <div className="weekly-container">
        <div className="profile-heading">
          <p className="small-heading">WEEKLY ANALYSIS</p>
          <h1>Your 7-Day Progress</h1>
          <p>
            Review your food, activity and weight progress from the last 7 days.
          </p>
        </div>

        {error && <div className="food-error">{error}</div>}

        {/* PROFILE SUMMARY */}
        {profile && (
          <div className="weekly-card">
            <div className="section-heading">
              <h2>Hello, {profile.name}</h2>
              <p>Your current profile information.</p>
            </div>

            <div className="weekly-stats-grid">
              <div className="weekly-stat">
                <span>Age</span>
                <strong>{profile.age} years</strong>
              </div>
              <div className="weekly-stat">
                <span>Height</span>
                <strong>{profile.height} cm</strong>
              </div>
              <div className="weekly-stat">
                <span>Current Weight</span>
                <strong>{profile.weight} kg</strong>
              </div>
              <div className="weekly-stat">
                <span>Goal</span>
                <strong>{profile.goal}</strong>
              </div>
            </div>
          </div>
        )}

        {/* WEEKLY OVERVIEW */}
        <div className="weekly-card">
          <div className="section-heading">
            <h2>Weekly Overview</h2>
            <p>Your overall activity and nutrition summary.</p>
          </div>

          <div className="weekly-stats-grid">
            <div className="weekly-stat">
              <span>Food Entries</span>
              <strong>{weeklyFoods.length}</strong>
            </div>
            <div className="weekly-stat">
              <span>Avg. Daily Calories</span>
              <strong>{averageCalories} kcal</strong>
            </div>
            <div className="weekly-stat">
              <span>Activity Time</span>
              <strong>{totalActivityMinutes} min</strong>
            </div>
            <div className="weekly-stat">
              <span>Calories Burned</span>
              <strong>{Math.round(totalActivityCalories)} kcal</strong>
            </div>
          </div>
        </div>

        {/* PROGRESS CHART */}
        <div className="weekly-card">
          <div className="section-heading">
            <h2>📊 Your Weekly Progress</h2>
            <p>Explore your recorded calories and activity each day.</p>
          </div>

          <div className="weekly-chart">
            {last7Days.map((day) => {
              const maximumCalories = Math.max(
                1,
                ...last7Days.map((item) => item.calories),
              );

              return (
                <div
                  className="weekly-chart-column"
                  key={day.date.toISOString()}
                >
                  <span className="weekly-chart-value">{day.calories}</span>

                  <div className="weekly-chart-track">
                    <div
                      className="weekly-chart-bar"
                      style={{
                        height:
                          day.calories > 0
                            ? `${Math.max(
                                5,
                                (day.calories / maximumCalories) * 100,
                              )}%`
                            : "0%",
                      }}
                      title={`${day.calories} kcal recorded`}
                    />
                  </div>

                  <strong>{day.label}</strong>
                  <small>{day.activityMinutes} min</small>
                </div>
              );
            })}
          </div>

          <p className="weekly-chart-note">
            Bars show recorded calories, not a calorie target. A day with no
            entries means no food was logged, not necessarily that no food was
            eaten.
          </p>
        </div>

        {/* WEEK-TO-WEEK COMPARISON */}
        <div className="weekly-card">
          <div className="section-heading">
            <h2>📈 Week-to-Week Comparison</h2>
            <p>See how your recorded habits changed over time.</p>
          </div>

          <div className="comparison-periods">
            <span>
              Previous: {formatDate(previousWeekStart)} –{" "}
              {formatDate(new Date(currentWeekStart.getTime() - 86400000))}
            </span>
            <span>
              Current: {formatDate(currentWeekStart)} – {formatDate(todayStart)}
            </span>
          </div>

          <div className="weekly-comparison-grid">
            <div className="weekly-comparison-item">
              <span>Average daily calories</span>
              <div className="comparison-values">
                <div>
                  <small>Previous</small>
                  <strong>
                    {previousFoodStats.averageCalories == null
                      ? "—"
                      : `${previousFoodStats.averageCalories} kcal`}
                  </strong>
                </div>
                <div>
                  <small>Current</small>
                  <strong>
                    {currentFoodStats.averageCalories == null
                      ? "—"
                      : `${currentFoodStats.averageCalories} kcal`}
                  </strong>
                </div>
              </div>
              <span className="comparison-change">
                {formatChange(
                  currentFoodStats.averageCalories,
                  previousFoodStats.averageCalories,
                )}
              </span>
            </div>

            <div className="weekly-comparison-item">
              <span>Average daily protein</span>
              <div className="comparison-values">
                <div>
                  <small>Previous</small>
                  <strong>
                    {previousFoodStats.averageProtein == null
                      ? "—"
                      : `${previousFoodStats.averageProtein} g`}
                  </strong>
                </div>
                <div>
                  <small>Current</small>
                  <strong>
                    {currentFoodStats.averageProtein == null
                      ? "—"
                      : `${currentFoodStats.averageProtein} g`}
                  </strong>
                </div>
              </div>
              <span className="comparison-change">
                {formatChange(
                  currentFoodStats.averageProtein,
                  previousFoodStats.averageProtein,
                )}
              </span>
            </div>

            <div className="weekly-comparison-item">
              <span>Total activity time</span>
              <div className="comparison-values">
                <div>
                  <small>Previous</small>
                  <strong>{previousActivityStats.minutes} min</strong>
                </div>
                <div>
                  <small>Current</small>
                  <strong>{currentActivityStats.minutes} min</strong>
                </div>
              </div>
              <span className="comparison-change">
                {formatChange(
                  currentActivityStats.minutes,
                  previousActivityStats.minutes,
                )}
              </span>
            </div>

            <div className="weekly-comparison-item">
              <span>Activity days</span>
              <div className="comparison-values">
                <div>
                  <small>Previous</small>
                  <strong>{previousActivityStats.days} days</strong>
                </div>
                <div>
                  <small>Current</small>
                  <strong>{currentActivityStats.days} days</strong>
                </div>
              </div>
              <span className="comparison-change">
                {formatChange(
                  currentActivityStats.days,
                  previousActivityStats.days,
                )}
              </span>
            </div>

            <div className="weekly-comparison-item">
              <span>Latest recorded weight</span>
              <div className="comparison-values">
                <div>
                  <small>Previous</small>
                  <strong>
                    {previousLatestWeight
                      ? `${previousLatestWeight.weight} kg`
                      : "—"}
                  </strong>
                </div>
                <div>
                  <small>Current</small>
                  <strong>
                    {currentLatestWeight
                      ? `${currentLatestWeight.weight} kg`
                      : "—"}
                  </strong>
                </div>
              </div>
              <span className="comparison-change">
                {weightDifference === null
                  ? "Need records in both periods"
                  : `${weightDifference > 0 ? "+" : ""}${weightDifference} kg`}
              </span>
            </div>
          </div>

          <div className="weekly-comparison-insight">
            <strong>💡 Your comparison insight</strong>
            <p>{comparisonSummary}</p>
          </div>

          <p className="weekly-chart-note">
            Comparisons use saved records only. Calorie and protein averages use
            days with food entries. A positive or negative change is not
            automatically good or bad.
          </p>
        </div>

        {/* NUTRITION SUMMARY */}
        <div className="weekly-card">
          <div className="section-heading">
            <h2>Nutrition Summary</h2>
            <p>Total nutrition recorded during the last 7 days.</p>
          </div>

          <div className="weekly-stats-grid">
            <div className="weekly-stat">
              <span>Calories</span>
              <strong>{Math.round(totalCalories)} kcal</strong>
            </div>
            <div className="weekly-stat">
              <span>Protein</span>
              <strong>{Math.round(totalProtein)} g</strong>
            </div>
            <div className="weekly-stat">
              <span>Carbohydrates</span>
              <strong>{Math.round(totalCarbs)} g</strong>
            </div>
            <div className="weekly-stat">
              <span>Fat</span>
              <strong>{Math.round(totalFat)} g</strong>
            </div>
          </div>

          <div className="weekly-average">
            <p>
              Average protein per day:
              <strong> {averageProtein} g</strong>
            </p>
          </div>
        </div>

        {/* ACTIVITY SUMMARY */}
        <div className="weekly-card">
          <div className="section-heading">
            <h2>Activity Summary</h2>
            <p>Your exercise and movement during the last 7 days.</p>
          </div>

          {weeklyActivities.length === 0 ? (
            <div className="empty-state">
              <h3>No activity recorded</h3>
              <p>Start adding activities from the Activity Tracker.</p>
              <button
                className="primary-button"
                onClick={() => navigate("/activity")}
              >
                Add Activity
              </button>
            </div>
          ) : (
            <div className="weekly-history">
              {weeklyActivities.map((activity) => (
                <div className="weekly-history-item" key={activity._id}>
                  <div>
                    <strong>{activity.activityType}</strong>
                    <p>
                      {activity.duration} minutes • {activity.calories} kcal
                    </p>
                    <small>{formatDate(getRecordDate(activity))}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* WEIGHT PROGRESS */}
        <div className="weekly-card">
          <div className="section-heading">
            <h2>Weight Progress</h2>
            <p>Your weight records from the last 7 days.</p>
          </div>

          {weeklyWeights.length === 0 ? (
            <div className="empty-state">
              <h3>No weight records</h3>
              <p>Add your weight regularly to track your progress.</p>
              <button
                className="primary-button"
                onClick={() => navigate("/weight")}
              >
                Track Weight
              </button>
            </div>
          ) : (
            <>
              <div className="weekly-stats-grid">
                <div className="weekly-stat">
                  <span>Latest Weight</span>
                  <strong>{weeklyWeights[0].weight} kg</strong>
                </div>

                {weeklyWeights.length >= 2 && (
                  <div className="weekly-stat">
                    <span>Change in Recorded Weight</span>
                    <strong>
                      {(
                        Number(weeklyWeights[0].weight) -
                        Number(weeklyWeights[weeklyWeights.length - 1].weight)
                      ).toFixed(1)}{" "}
                      kg
                    </strong>
                  </div>
                )}
              </div>

              <div className="weekly-history">
                {weeklyWeights.map((record) => (
                  <div className="weekly-history-item" key={record._id}>
                    <div>
                      <strong>{record.weight} kg</strong>
                      <p>{formatDate(getRecordDate(record))}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* RECENT FOOD ENTRIES */}
        <div className="weekly-card">
          <div className="section-heading">
            <h2>Recent Food Entries</h2>
            <p>Foods you recorded during the last 7 days.</p>
          </div>

          {weeklyFoods.length === 0 ? (
            <div className="empty-state">
              <h3>No food entries</h3>
              <p>Upload your meals to start analyzing your nutrition.</p>
              <button
                className="primary-button"
                onClick={() => navigate("/food-upload")}
              >
                Upload Food
              </button>
            </div>
          ) : (
            <div className="weekly-history">
              {weeklyFoods
                .slice()
                .sort((a, b) => getRecordDate(b) - getRecordDate(a))
                .slice(0, 10)
                .map((food) => (
                  <div className="weekly-history-item" key={food._id}>
                    <div>
                      <strong>{food.foodName}</strong>
                      <p>
                        {food.mealType} • {food.calories} kcal
                      </p>
                      <small>
                        Protein: {food.protein} g • Carbs: {food.carbs} g • Fat:{" "}
                        {food.fat} g
                      </small>
                      <small>{formatDate(getRecordDate(food))}</small>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* TRACKING SCORE */}
        <div className="weekly-card">
          <div className="section-heading">
            <h2>🎯 Your Tracking Score</h2>
            <p>
              A measure of logging consistency, not your health or diet quality.
            </p>
          </div>

          <div className="weekly-stats-grid">
            <div className="weekly-stat">
              <span>Tracking Score</span>
              <strong>{trackingScore}/100</strong>
            </div>
            <div className="weekly-stat">
              <span>Meal Logging Days</span>
              <strong>{foodLoggingDays}/7</strong>
            </div>
            <div className="weekly-stat">
              <span>Activity Days</span>
              <strong>{activityDays}/7</strong>
            </div>
            <div className="weekly-stat">
              <span>Different Foods</span>
              <strong>{uniqueFoods}</strong>
            </div>
          </div>
        </div>

        {/* INSIGHTS */}
        <div className="weekly-card">
          <div className="section-heading">
            <h2>💡 Weekly Insights</h2>
            <p>Observations based on your recorded habits.</p>
          </div>

          <div className="weekly-history">
            {weeklyInsights.map((insight, index) => (
              <div className="weekly-history-item" key={index}>
                <p>{insight}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ACHIEVEMENTS */}
        <div className="weekly-card">
          <div className="section-heading">
            <h2>🏆 Weekly Achievements</h2>
            <p>Build consistent habits one week at a time.</p>
          </div>

          <div className="weekly-history">
            {achievements.map((achievement) => (
              <div className="weekly-history-item" key={achievement.title}>
                <div>
                  <strong>
                    {achievement.icon} {achievement.title}
                  </strong>
                  <p>{achievement.description}</p>
                  <small>
                    {achievement.unlocked ? "Unlocked!" : "Keep going"}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* NEXT WEEK CHALLENGE */}
        <div className="weekly-card">
          <div className="section-heading">
            <h2>🚀 Your Next-Week Challenge</h2>
            <p>Choose a small, realistic habit to work on.</p>
          </div>

          <ul>
            <li>Record meals on at least five days.</li>
            <li>Log movement that suits your comfort and ability.</li>
            <li>
              Aim for variety and regular meals rather than extreme
              restrictions.
            </li>
            <li>Record weight consistently, under similar conditions.</li>
          </ul>
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
            onClick={() => navigate("/food-upload")}
          >
            Upload Food
          </button>
          <button
            className="secondary-button"
            onClick={() => navigate("/activity")}
          >
            Activity
          </button>
          <button
            className="secondary-button"
            onClick={() => navigate("/weight")}
          >
            Weight
          </button>
        </div>

        {/* DISCLAIMER */}
        <div className="ai-disclaimer">
          <strong>Important:</strong> Weekly analysis is based on the records
          saved in your application. It is intended for general tracking and is
          not a medical diagnosis or a substitute for professional advice.
        </div>
      </div>
    </div>
  );
}

export default WeeklyAnalysis;
