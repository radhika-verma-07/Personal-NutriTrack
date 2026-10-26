import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [foods, setFoods] = useState([]);
  const [activities, setActivities] = useState([]);
  const [weights, setWeights] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userId = localStorage.getItem("userId");

  /* =====================================================
     LOAD EVERYTHING FROM MONGODB
  ===================================================== */

  const loadDashboard = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [profileResponse, foodResponse, activityResponse, weightResponse] =
        await Promise.all([
          fetch(
            `https://personal-nutritrack-api.onrender.com/api/users/${userId}`,
          ),

          fetch(
            `https://personal-nutritrack-api.onrender.com/api/foods/user/${userId}`,
          ),

          fetch(
            `https://personal-nutritrack-api.onrender.com/api/activities/user/${userId}`,
          ),

          fetch(
            `https://personal-nutritrack-api.onrender.com/api/weights/user/${userId}`,
          ),
        ]);

      const profileData = await profileResponse.json();

      const foodData = await foodResponse.json();

      const activityData = await activityResponse.json();

      const weightData = await weightResponse.json();

      if (!profileResponse.ok) {
        throw new Error(profileData.error || "Failed to load profile.");
      }

      if (!foodResponse.ok) {
        throw new Error(foodData.error || "Failed to load food data.");
      }

      if (!activityResponse.ok) {
        throw new Error(activityData.error || "Failed to load activity data.");
      }

      if (!weightResponse.ok) {
        throw new Error(weightData.error || "Failed to load weight data.");
      }

      setProfile(profileData.user);
      setFoods(foodData.foods || []);
      setActivities(activityData.activities || []);
      setWeights(weightData.weights || []);
    } catch (error) {
      console.error("Dashboard loading error:", error);

      setError(error.message || "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [userId]);

  /* =====================================================
     DATE HELPERS
  ===================================================== */

  const isToday = (date) => {
    const itemDate = new Date(date);
    const today = new Date();

    return (
      itemDate.getDate() === today.getDate() &&
      itemDate.getMonth() === today.getMonth() &&
      itemDate.getFullYear() === today.getFullYear()
    );
  };

  const isWithinLast7Days = (date) => {
    const itemDate = new Date(date);
    const today = new Date();

    const difference = today.getTime() - itemDate.getTime();

    return difference >= 0 && difference <= 7 * 24 * 60 * 60 * 1000;
  };

  /* =====================================================
     TODAY DATA
  ===================================================== */

  const todayFoods = foods.filter((food) => isToday(food.date));

  const todayActivities = activities.filter((activity) =>
    isToday(activity.date),
  );

  /* =====================================================
     LATEST WEIGHT
  ===================================================== */

  const latestWeight =
    weights.length > 0
      ? Number(weights[0].weight)
      : Number(profile?.weight) || 0;

  const previousWeight = weights.length > 1 ? Number(weights[1].weight) : null;

  const weightChange =
    previousWeight !== null ? latestWeight - previousWeight : null;

  /* =====================================================
     PERSONALIZED REQUIREMENTS
  ===================================================== */

  const calculateRequirements = () => {
    if (!profile) {
      return {
        bmr: 0,
        tdee: 0,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      };
    }

    const age = Number(profile.age) || 0;

    const height = Number(profile.height) || 0;

    const weight = latestWeight || Number(profile.weight) || 0;

    let bmr;

    if (profile.gender?.toLowerCase() === "male") {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
    };

    const multiplier = activityMultipliers[profile.activityLevel] || 1.2;

    const tdee = bmr * multiplier;

    let calories = tdee;

    if (profile.goal === "weight-loss") {
      calories = tdee - 300;
    }

    if (profile.goal === "weight-gain") {
      calories = tdee + 300;
    }

    calories = Math.max(Math.round(calories), 1200);

    const protein = Math.round((calories * 0.2) / 4);

    const carbs = Math.round((calories * 0.5) / 4);

    const fat = Math.round((calories * 0.3) / 9);

    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      calories,
      protein,
      carbs,
      fat,
    };
  };

  const requirements = calculateRequirements();

  /* =====================================================
     TODAY NUTRITION
  ===================================================== */

  const consumed = todayFoods.reduce(
    (total, food) => {
      total.calories += Number(food.calories) || 0;

      total.protein += Number(food.protein) || 0;

      total.carbs += Number(food.carbs) || 0;

      total.fat += Number(food.fat) || 0;

      return total;
    },
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    },
  );

  /* =====================================================
     ACTIVITY
  ===================================================== */

  const activity = todayActivities.reduce(
    (total, item) => {
      total.minutes += Number(item.duration) || 0;

      total.calories += Number(item.calories) || 0;

      return total;
    },
    {
      minutes: 0,
      calories: 0,
    },
  );

  /* =====================================================
     REMAINING
  ===================================================== */

  const remaining = {
    calories: Math.max(requirements.calories - consumed.calories, 0),

    protein: Math.max(requirements.protein - consumed.protein, 0),

    carbs: Math.max(requirements.carbs - consumed.carbs, 0),

    fat: Math.max(requirements.fat - consumed.fat, 0),
  };

  /* =====================================================
     PERCENTAGES
  ===================================================== */

  const percentage = (value, target) => {
    if (!target) {
      return 0;
    }

    return Math.min(Math.round((value / target) * 100), 100);
  };

  const percentages = {
    calories: percentage(consumed.calories, requirements.calories),

    protein: percentage(consumed.protein, requirements.protein),

    carbs: percentage(consumed.carbs, requirements.carbs),

    fat: percentage(consumed.fat, requirements.fat),
  };

  /* =====================================================
     GOAL TEXT
  ===================================================== */

  const getGoalText = () => {
    if (!profile) {
      return "";
    }

    if (profile.goal === "weight-loss") {
      return "Your dashboard is focused on gradual weight management and better food choices.";
    }

    if (profile.goal === "weight-gain") {
      return "Your dashboard is focused on adequate nutrition and healthy weight gain.";
    }

    return "Your dashboard is focused on maintaining balanced nutrition and healthy activity.";
  };

  /* =====================================================
     SMART GUIDANCE
  ===================================================== */

  // =====================================================
  // SMART, PERSONALIZED ACTIONABLE RECOMMENDATIONS
  // =====================================================

  const generateSmartGuidance = () => {
    const guidance = [];

    const calories = Number(consumed.calories) || 0;
    const protein = Number(consumed.protein) || 0;
    const carbs = Number(consumed.carbs) || 0;
    const fat = Number(consumed.fat) || 0;

    const calorieTarget = Number(requirements.calories) || 0;
    const proteinTarget = Number(requirements.protein) || 0;
    const carbTarget = Number(requirements.carbs) || 0;
    const fatTarget = Number(requirements.fat) || 0;

    const caloriesLeft = Math.max(0, calorieTarget - calories);
    const proteinLeft = Math.max(0, proteinTarget - protein);

    const goal = String(profile?.goal || "").toLowerCase();

    const isWeightLoss = goal.includes("loss") || goal.includes("lose");
    const isWeightGain = goal.includes("gain") || goal.includes("increase");
    const isMaintenance = !isWeightLoss && !isWeightGain;

    const addGuidance = (priority, type, icon, title, text) => {
      guidance.push({ priority, type, icon, title, text });
    };

    // 1. FOOD TRACKING
    if (todayFoods.length === 0) {
      addGuidance(
        100,
        "action",
        "🍽️",
        "Start Your Food Tracking",
        "No food has been logged today. Upload a meal photo to estimate its nutrition and get recommendations based on your personal goal.",
      );
    } else {
      addGuidance(
        35,
        "action",
        "📊",
        "Your Nutrition So Far",
        `You have logged ${todayFoods.length} food ${todayFoods.length === 1 ? "entry" : "entries"} and approximately ${Math.round(calories)} kcal. Your estimated daily target is ${calorieTarget} kcal, with about ${Math.round(caloriesLeft)} kcal remaining.`,
      );
    }

    // 2. CALORIES: PERSONALIZE BY GOAL
    if (calorieTarget > 0 && calories >= calorieTarget) {
      if (isWeightLoss) {
        addGuidance(
          95,
          "warning",
          "🎯",
          "Review Your Remaining Meals",
          `Your logged intake has reached or exceeded your estimated ${calorieTarget} kcal target. Check your portions and choose your next meal according to hunger and your remaining nutrition needs. Avoid extreme restriction or skipping meals to compensate.`,
        );
      } else if (isWeightGain) {
        addGuidance(
          90,
          "progress",
          "💪",
          "Check Your Overall Nutrition",
          `You have reached your estimated ${calorieTarget} kcal target. For your weight-gain goal, also check protein and overall meal balance rather than adding calories without considering nutritional quality.`,
        );
      } else {
        addGuidance(
          90,
          "progress",
          "⚖️",
          "Daily Calorie Target Reached",
          `You have reached your estimated ${calorieTarget} kcal target. Review your hunger, food quality and remaining nutrient needs when planning your next meal.`,
        );
      }
    } else if (
      calorieTarget > 0 &&
      todayFoods.length > 0 &&
      calories < calorieTarget * 0.45
    ) {
      if (isWeightGain) {
        addGuidance(
          90,
          "action",
          "🥜",
          "Build Up Your Daily Intake",
          `You have logged ${Math.round(calories)} kcal so far. Consider a balanced meal or snack with energy and protein, such as curd with nuts, paneer with roti, or beans with rice, according to your appetite.`,
        );
      } else if (isWeightLoss) {
        addGuidance(
          85,
          "action",
          "🥗",
          "Choose a Filling, Balanced Meal",
          `Your logged intake is ${Math.round(calories)} kcal so far. Choose a balanced meal with vegetables, protein and a suitable carbohydrate portion instead of trying to eat as little as possible.`,
        );
      } else {
        addGuidance(
          85,
          "action",
          "🍲",
          "Plan Your Next Balanced Meal",
          `You have logged ${Math.round(calories)} kcal so far. Plan a balanced meal with protein, vegetables and carbohydrates to help meet your estimated daily needs.`,
        );
      }
    }

    // 3. PROTEIN: USE THE SIZE OF THE NUTRITION GAP
    if (proteinTarget > 0 && protein < proteinTarget * 0.7) {
      addGuidance(
        88,
        "protein",
        "💪",
        "Prioritize Protein",
        `You have logged ${protein.toFixed(1)} g of protein against an estimated ${proteinTarget} g target. Approximately ${proteinLeft.toFixed(1)} g remains. Include suitable options such as dal, beans, paneer, curd, eggs or tofu across your meals.`,
      );
    } else if (
      proteinTarget > 0 &&
      protein < proteinTarget &&
      todayFoods.length > 0
    ) {
      addGuidance(
        60,
        "protein",
        "🥛",
        "Close Your Protein Gap",
        `Your protein intake is ${protein.toFixed(1)} g, with approximately ${proteinLeft.toFixed(1)} g left to reach your estimated target. Consider adding a protein source to your next meal if you are hungry.`,
      );
    }

    // 4. CARBOHYDRATES
    if (carbTarget > 0 && carbs > carbTarget * 1.1) {
      addGuidance(
        82,
        "warning",
        "🍚",
        "Balance Your Carbohydrate Intake",
        `Your estimated carbohydrate intake is ${carbs.toFixed(1)} g, above your ${carbTarget} g target. For your next meal, balance the portion with vegetables and protein instead of adding more refined carbohydrates.`,
      );
    } else if (
      carbTarget > 0 &&
      carbs < carbTarget * 0.5 &&
      todayFoods.length > 0
    ) {
      addGuidance(
        45,
        "action",
        "🌾",
        "Check Your Energy Sources",
        "Your logged carbohydrate intake is relatively low compared with your estimated target. Consider a suitable portion of roti, rice, oats, fruit or another carbohydrate source as part of a balanced meal.",
      );
    }

    // 5. FAT
    if (fatTarget > 0 && fat > fatTarget * 1.1) {
      addGuidance(
        80,
        "warning",
        "🥘",
        "Review Added Fats",
        `Your estimated fat intake is ${fat.toFixed(1)} g, above your ${fatTarget} g target. Consider limiting additional oil-heavy or fried foods while still including appropriate sources of dietary fat.`,
      );
    }

    // 6. ACTIVITY
    const activityMinutes = Number(activity.minutes) || 0;
    const activityCalories = Number(activity.calories) || 0;

    if (activityMinutes === 0) {
      addGuidance(
        65,
        "activity",
        "🚶",
        "Add Movement to Your Day",
        "No activity has been logged today. If suitable for you, try a comfortable 10–15 minute walk or log movement you have already completed.",
      );
    } else if (activityMinutes < 30) {
      addGuidance(
        55,
        "activity",
        "🏃",
        "Build on Your Activity",
        `You have logged ${activityMinutes} minutes of activity. If you feel comfortable, consider another short walk or movement session. Choose an amount that suits your fitness and health.`,
      );
    } else {
      addGuidance(
        50,
        "success",
        "🔥",
        "Keep Your Activity Consistent",
        `You have logged ${activityMinutes} minutes of activity and an estimated ${Math.round(activityCalories)} kcal burned. Maintain a sustainable routine and eat enough to support your needs.`,
      );
    }

    // 7. WEIGHT TREND
    if (weightChange !== null && weightChange !== 0) {
      if (isWeightLoss && weightChange < 0) {
        addGuidance(
          75,
          "success",
          "📉",
          "Your Weight Trend Is Down",
          `Your latest recorded weight is ${latestWeight} kg, ${Math.abs(weightChange).toFixed(1)} kg lower than the previous record. Look at trends over several weeks, since short-term changes can reflect water and normal fluctuations.`,
        );
      } else if (isWeightGain && weightChange > 0) {
        addGuidance(
          75,
          "success",
          "📈",
          "Your Weight Trend Is Up",
          `Your latest recorded weight is ${latestWeight} kg, ${weightChange.toFixed(1)} kg higher than the previous record. Monitor the longer-term trend alongside nutrition, activity and how you feel.`,
        );
      } else if (isWeightLoss && weightChange > 0) {
        addGuidance(
          75,
          "attention",
          "🎯",
          "Review Your Recent Trend",
          `Your latest recorded weight is ${latestWeight} kg, up ${weightChange.toFixed(1)} kg from the previous record. One measurement does not establish a trend; review several weeks of data before changing your routine.`,
        );
      } else if (isWeightGain && weightChange < 0) {
        addGuidance(
          75,
          "attention",
          "📋",
          "Review Your Weight-Gain Routine",
          `Your latest weight is ${latestWeight} kg, down ${Math.abs(weightChange).toFixed(1)} kg from the previous record. Review your intake and longer-term trend before adjusting your plan.`,
        );
      } else {
        addGuidance(
          55,
          "progress",
          "⚖️",
          "Monitor Your Weight Trend",
          `Your latest weight is ${latestWeight} kg. Compare measurements taken under similar conditions over several weeks to understand your maintenance trend.`,
        );
      }
    }

    // Show the most relevant recommendations first.
    // Priority affects ordering, not the recommendation content.
    return guidance.sort((a, b) => b.priority - a.priority).slice(0, 5);
  };

  const smartGuidance = generateSmartGuidance();

  // =====================================================
  // PERSONALIZED NEXT-MEAL RECOMMENDATIONS
  // =====================================================

  const generateNextMeal = () => {
    const recommendations = [];

    const calories = Number(consumed.calories) || 0;
    const protein = Number(consumed.protein) || 0;
    const carbs = Number(consumed.carbs) || 0;
    const fat = Number(consumed.fat) || 0;

    const calorieTarget = Number(requirements.calories) || 0;
    const proteinTarget = Number(requirements.protein) || 0;
    const carbTarget = Number(requirements.carbs) || 0;
    const fatTarget = Number(requirements.fat) || 0;

    const caloriesLeft = calorieTarget - calories;
    const proteinLeft = proteinTarget - protein;

    const goal = String(profile?.goal || "").toLowerCase();
    const isWeightLoss = goal.includes("loss") || goal.includes("lose");
    const isWeightGain = goal.includes("gain") || goal.includes("increase");

    // Choose meal guidance based on the user's goal.
    if (isWeightLoss) {
      recommendations.push(
        "For your weight-loss goal, build your next meal around protein and vegetables with a suitable portion of carbohydrates. Avoid extreme restriction.",
      );
    } else if (isWeightGain) {
      recommendations.push(
        "For your weight-gain goal, consider a balanced, energy-rich meal such as paneer or beans with roti or rice, adjusting portions to your appetite and remaining needs.",
      );
    } else {
      recommendations.push(
        "For weight maintenance, aim for a balanced meal containing protein, vegetables, carbohydrates and an appropriate amount of fat.",
      );
    }

    // Personalize the protein advice.
    if (proteinTarget > 0 && proteinLeft > proteinTarget * 0.3) {
      recommendations.push(
        `Protein is still a priority: you have logged ${protein.toFixed(1)} g of an estimated ${proteinTarget} g target. Consider dal, beans, paneer, curd, eggs or tofu.`,
      );
    } else if (proteinTarget > 0 && protein < proteinTarget) {
      recommendations.push(
        `You are getting closer to your protein target, with about ${Math.max(0, proteinLeft).toFixed(1)} g remaining. Include a suitable protein source if needed.`,
      );
    } else if (proteinTarget > 0) {
      recommendations.push(
        "Your logged protein has reached its estimated target. Focus on overall meal balance and your other nutrition needs.",
      );
    }

    // Respond to carbohydrate and fat intake.
    if (carbTarget > 0 && carbs > carbTarget * 1.1) {
      recommendations.push(
        "Your estimated carbohydrate intake is already high relative to your target. Keep the next carbohydrate portion moderate and include vegetables and protein.",
      );
    } else if (fatTarget > 0 && fat > fatTarget * 1.1) {
      recommendations.push(
        "Your estimated fat intake is above its target. Consider a lightly cooked meal and avoid adding lots of oil or fried sides.",
      );
    } else if (carbTarget > 0 && carbs < carbTarget * 0.5 && caloriesLeft > 0) {
      recommendations.push(
        "Your logged carbohydrate intake is relatively low. A suitable portion of roti, rice, oats or fruit can complement your next balanced meal.",
      );
    }

    // Calorie status depends on the selected goal.
    if (calorieTarget > 0 && caloriesLeft <= 0) {
      recommendations.push(
        "Your estimated calorie target has been reached. Base any further food choices on hunger, overall nutrition and your individual needs rather than trying to compensate by skipping meals.",
      );
    } else if (calorieTarget > 0 && isWeightGain) {
      recommendations.push(
        `Approximately ${Math.round(caloriesLeft)} kcal remain in your estimated daily target. If you are hungry, choose a nourishing meal or snack to help meet your needs.`,
      );
    } else if (calorieTarget > 0 && isWeightLoss) {
      recommendations.push(
        `Approximately ${Math.round(caloriesLeft)} kcal remain in your estimated target. Plan satisfying, balanced meals rather than aiming to eat as little as possible.`,
      );
    } else if (calorieTarget > 0) {
      recommendations.push(
        `Approximately ${Math.round(caloriesLeft)} kcal remain in your estimated daily target. Use this as a guide alongside hunger and meal balance.`,
      );
    }

    // Return the three most useful suggestions.
    return recommendations.slice(0, 3);
  };

  const nextMeal = generateNextMeal();

  /* =====================================================
     WEEKLY SUMMARY
  ===================================================== */

  const weeklyFoods = foods.filter((food) => isWithinLast7Days(food.date));

  const weeklyActivities = activities.filter((activity) =>
    isWithinLast7Days(activity.date),
  );

  const weeklyCalories = weeklyFoods.reduce(
    (sum, food) => sum + (Number(food.calories) || 0),
    0,
  );

  const weeklyProtein = weeklyFoods.reduce(
    (sum, food) => sum + (Number(food.protein) || 0),
    0,
  );

  const weeklyActivityMinutes = weeklyActivities.reduce(
    (sum, activity) => sum + (Number(activity.duration) || 0),
    0,
  );

  const weeklyActivityCalories = weeklyActivities.reduce(
    (sum, activity) => sum + (Number(activity.calories) || 0),
    0,
  );

  const averageCalories = Math.round(weeklyCalories / 7);

  const averageProtein = Math.round((weeklyProtein / 7) * 10) / 10;

  const activeDays = new Set(
    weeklyActivities.map((activity) =>
      new Date(activity.date).toLocaleDateString(),
    ),
  ).size;

  /* =====================================================
     PROGRESS BAR
  ===================================================== */

  const ProgressBar = ({ value, target }) => {
    const percent = percentage(value, target);

    return (
      <div className="dashboard-progress">
        <div
          className="dashboard-progress-fill"
          style={{
            width: `${percent}%`,
          }}
        />
      </div>
    );
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-container">
          <div className="dashboard-empty">
            <div className="dashboard-empty-icon">🔄</div>

            <h1>Updating Your Dashboard</h1>

            <p>Collecting your latest food, activity and weight data...</p>
          </div>
        </div>
      </div>
    );
  }

  /* =====================================================
     NO PROFILE
  ===================================================== */

  if (!userId || !profile) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-container">
          <div className="dashboard-empty">
            <div className="dashboard-empty-icon">👤</div>

            <h1>Create Your Profile First</h1>

            <p>
              Your personalized dashboard needs your age, gender, height,
              weight, activity level and goal.
            </p>

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

  return (
    <>
      <div className="dashboard-page">
        <div className="dashboard-container">
          {/* =================================================
            HEADER
        ================================================= */}

          <div className="dashboard-header">
            <div>
              <p className="small-heading">PERSONALIZED NUTRITRACK</p>

              <h1>Hello, {profile.name} 👋</h1>

              <p>{getGoalText()}</p>
            </div>

            <button
              className="primary-button"
              onClick={() => navigate("/food-upload")}
            >
              📸 Analyze Food
            </button>
          </div>

          {error && <div className="food-error">{error}</div>}

          {/* =================================================
            LIVE STATUS
        ================================================= */}

          <div className="dashboard-live-card">
            <div>
              <span>🔴 LIVE PERSONALIZATION</span>

              <h2>Your dashboard is based on today's actual records</h2>

              <p>
                Food: {todayFoods.length} meals
                {" • "}
                Activity: {activity.minutes} min
                {" • "}
                Weight: {latestWeight} kg
              </p>
            </div>

            <button className="dashboard-refresh" onClick={loadDashboard}>
              🔄 Update Now
            </button>
          </div>

          {/* =================================================
            TODAY'S NUTRITION
        ================================================= */}

          <div className="dashboard-section">
            <div className="section-heading">
              <h2>📊 Today's Nutrition</h2>

              <p>
                Your actual intake compared with your personalized requirement.
              </p>
            </div>

            <div className="dashboard-nutrition-grid">
              <div className="dashboard-nutrition-card">
                <div className="nutrition-card-top">
                  <span>🔥 Calories</span>

                  <strong>{Math.round(consumed.calories)}</strong>
                </div>

                <p>of {requirements.calories} kcal</p>

                <ProgressBar
                  value={consumed.calories}
                  target={requirements.calories}
                />

                <small>
                  {remaining.calories > 0
                    ? `${Math.round(remaining.calories)} kcal remaining`
                    : "Target reached"}
                </small>
              </div>

              <div className="dashboard-nutrition-card">
                <div className="nutrition-card-top">
                  <span>💪 Protein</span>

                  <strong>{consumed.protein.toFixed(1)}</strong>
                </div>

                <p>of {requirements.protein} g</p>

                <ProgressBar
                  value={consumed.protein}
                  target={requirements.protein}
                />

                <small>{remaining.protein.toFixed(1)} g remaining</small>
              </div>

              <div className="dashboard-nutrition-card">
                <div className="nutrition-card-top">
                  <span>🍚 Carbs</span>

                  <strong>{consumed.carbs.toFixed(1)}</strong>
                </div>

                <p>of {requirements.carbs} g</p>

                <ProgressBar
                  value={consumed.carbs}
                  target={requirements.carbs}
                />

                <small>{remaining.carbs.toFixed(1)} g remaining</small>
              </div>

              <div className="dashboard-nutrition-card">
                <div className="nutrition-card-top">
                  <span>🥑 Fat</span>

                  <strong>{consumed.fat.toFixed(1)}</strong>
                </div>

                <p>of {requirements.fat} g</p>

                <ProgressBar value={consumed.fat} target={requirements.fat} />

                <small>{remaining.fat.toFixed(1)} g remaining</small>
              </div>
            </div>
          </div>

          {/* =================================================
            MAIN SMART GUIDANCE
        ================================================= */}

          <div className="dashboard-section smart-guidance-main">
            <div className="smart-guidance-heading">
              <div>
                <span className="small-heading">⭐ MOST IMPORTANT</span>

                <h2>🧠 Smart Guidance</h2>

                <p>
                  This section changes automatically according to your latest
                  food, activity, weight and goal.
                </p>
              </div>

              <div className="guidance-live-badge">LIVE</div>
            </div>

            <div className="management-grid">
              {smartGuidance.map((item, index) => (
                <div className={`management-card ${item.type}`} key={index}>
                  <div className="management-icon">{item.icon}</div>

                  <div>
                    <h3>{item.title}</h3>

                    <p>{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* =================================================
            NEXT MEAL
        ================================================= */}

          <div className="dashboard-section">
            <div className="next-meal-card">
              <div className="next-meal-header">
                <div>
                  <span className="small-heading">
                    ACTIONABLE RECOMMENDATION
                  </span>

                  <h2>🍽️ What Should You Eat Next?</h2>

                  <p>
                    Recommended from your remaining nutrition, not from a fixed
                    message.
                  </p>
                </div>
              </div>

              <div className="next-meal-content">
                {nextMeal.map((recommendation, index) => (
                  <div className="next-meal-item" key={index}>
                    <span>{index + 1}</span>

                    <p>{recommendation}</p>
                  </div>
                ))}
              </div>

              <div className="remaining-box">
                <div>
                  <span>Calories available</span>

                  <strong>{Math.round(remaining.calories)} kcal</strong>
                </div>

                <div>
                  <span>Protein needed</span>

                  <strong>{remaining.protein.toFixed(1)} g</strong>
                </div>

                <div>
                  <span>Carbs available</span>

                  <strong>{remaining.carbs.toFixed(1)} g</strong>
                </div>

                <div>
                  <span>Fat available</span>

                  <strong>{remaining.fat.toFixed(1)} g</strong>
                </div>
              </div>
            </div>
          </div>

          {/* =================================================
            ACTIVITY
        ================================================= */}

          <div className="dashboard-section">
            <div className="section-heading">
              <h2>🏃 Today's Activity</h2>

              <p>
                Your activity is included in the current management guidance.
              </p>
            </div>

            <div className="activity-summary-grid">
              <div className="activity-summary-card">
                <span>Exercise Time</span>

                <strong>{activity.minutes}</strong>

                <small>minutes</small>
              </div>

              <div className="activity-summary-card">
                <span>Calories Burned</span>

                <strong>{Math.round(activity.calories)}</strong>

                <small>kcal</small>
              </div>

              <div className="activity-summary-card">
                <span>Food Calories</span>

                <strong>{Math.round(consumed.calories)}</strong>

                <small>kcal</small>
              </div>
            </div>

            <button
              className="secondary-button"
              onClick={() => navigate("/activity")}
            >
              💪 Update Activity
            </button>
          </div>

          {/* =================================================
            PERSONALIZED TARGET
        ================================================= */}

          <div className="dashboard-section">
            <div className="section-heading">
              <h2>🎯 Your Personalized Target</h2>

              <p>
                These values are recalculated using your latest recorded weight.
              </p>
            </div>

            <div className="requirements-grid">
              <div>
                <span>BMR</span>

                <strong>{requirements.bmr}</strong>

                <small>kcal/day</small>
              </div>

              <div>
                <span>TDEE</span>

                <strong>{requirements.tdee}</strong>

                <small>kcal/day</small>
              </div>

              <div>
                <span>Daily Calories</span>

                <strong>{requirements.calories}</strong>

                <small>kcal/day</small>
              </div>

              <div>
                <span>Protein</span>

                <strong>{requirements.protein}</strong>

                <small>g/day</small>
              </div>

              <div>
                <span>Carbohydrates</span>

                <strong>{requirements.carbs}</strong>

                <small>g/day</small>
              </div>

              <div>
                <span>Fat</span>

                <strong>{requirements.fat}</strong>

                <small>g/day</small>
              </div>
            </div>
          </div>

          {/* =================================================
            WEIGHT
        ================================================= */}

          <div className="dashboard-section">
            <div className="section-heading">
              <h2>⚖️ Weight Progress</h2>
            </div>

            <div className="weight-dashboard-card">
              <div>
                <span>Latest Weight</span>

                <strong>{latestWeight} kg</strong>
              </div>

              {weightChange !== null && (
                <div>
                  <span>Change From Previous</span>

                  <strong>
                    {weightChange > 0
                      ? `+${weightChange.toFixed(1)}`
                      : weightChange.toFixed(1)}{" "}
                    kg
                  </strong>
                </div>
              )}

              <button
                className="secondary-button"
                onClick={() => navigate("/weight")}
              >
                ⚖️ Update Weight
              </button>
            </div>
          </div>

          {/* =================================================
            WEEKLY SNAPSHOT
        ================================================= */}

          <div className="dashboard-section">
            <div className="section-heading">
              <h2>📈 7-Day Snapshot</h2>

              <p>Your recent records from MongoDB.</p>
            </div>

            <div className="weekly-grid">
              <div>
                <span>Foods Logged</span>

                <strong>{weeklyFoods.length}</strong>
              </div>

              <div>
                <span>Average Calories</span>

                <strong>{averageCalories}</strong>

                <small>kcal/day</small>
              </div>

              <div>
                <span>Average Protein</span>
                <strong>{averageProtein}</strong>
                <small>g/day</small>
              </div>

              <div>
                <span>Active Days</span>
                <strong>{activeDays}</strong>
                <small>/ 7</small>
              </div>
              <div>
                <span>Exercise</span>
                <strong>{weeklyActivityMinutes}</strong>
                <small>min</small>
              </div>
              <div>
                <span>Activity Calories</span>
                <strong>{Math.round(weeklyActivityCalories)}</strong>
                <small>kcal</small>
              </div>
            </div>
            <button
              className="primary-button"
              onClick={() => navigate("/weekly")}
            >
              📈 View Full Weekly Analysis
            </button>
          </div>
          {/* =================================================
            TODAY'S FOOD
        ================================================= */}
          <div className="dashboard-section">
            <div className="section-heading">
              <h2>🍴 Today's Food</h2>
              <p>Every saved meal contributes to your Smart Guidance.</p>
            </div>
            {todayFoods.length === 0 ? (
              <div className="dashboard-empty-small">
                <p>No food has been logged today.</p>

                <button
                  className="primary-button"
                  onClick={() => navigate("/food-upload")}
                >
                  📸 Analyze First Meal
                </button>
              </div>
            ) : (
              <div className="today-food-list">
                {todayFoods.map((food) => (
                  <div className="today-food-item" key={food._id}>
                    <div>
                      <strong>{food.foodName}</strong>

                      <span>{food.mealType}</span>
                    </div>

                    <div>
                      <strong>{food.calories} kcal</strong>

                      <span>
                        P {food.protein}g · C {food.carbs}g · F {food.fat}g
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* =================================================
            ACTIONS
        ================================================= */}

          <div className="dashboard-action-grid">
            <button onClick={() => navigate("/food-upload")}>
              📸 Analyze Food
            </button>
            <button onClick={() => navigate("/food-vault")}>
              🍽️ Food Vault
            </button>
            <button onClick={() => navigate("/activity")}>🏃 Activity</button>
            <button onClick={() => navigate("/weight")}>⚖️ Weight</button>
            <button onClick={() => navigate("/weekly")}>
              📈 Weekly Analysis
            </button>
          </div>
          <p className="dashboard-disclaimer">
            Nutrition values from food images are estimates. This application
            provides general educational tracking and guidance and is not a
            medical diagnosis or treatment system.
          </p>
        </div>
      </div>
    </>
  );
}
export default Dashboard;
