/* =====================================================
   MANAGEMENT ENGINE
   Obesity Management - Personalized Food & Fitness Analyzer
===================================================== */


/* -----------------------------------------------------
   DATE HELPERS
----------------------------------------------------- */

function isToday(dateValue) {
  const date = new Date(dateValue);
  const today = new Date();

  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}


function isWithinLastDays(dateValue, days) {
  const date = new Date(dateValue);
  const today = new Date();

  const difference =
    today.getTime() - date.getTime();

  const differenceInDays =
    difference / (1000 * 60 * 60 * 24);

  return (
    differenceInDays >= 0 &&
    differenceInDays < days
  );
}


/* -----------------------------------------------------
   PERSONALIZED REQUIREMENT
----------------------------------------------------- */

function calculateRequirements(profile) {

  if (!profile) {
    return {
      bmr: 0,
      tdee: 0,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    };
  }

  const age = Number(profile.age) || 0;
  const height = Number(profile.height) || 0;
  const weight = Number(profile.weight) || 0;

  let bmr;

  if (
    String(profile.gender).toLowerCase() ===
    "male"
  ) {
    bmr =
      10 * weight +
      6.25 * height -
      5 * age +
      5;
  } else {
    bmr =
      10 * weight +
      6.25 * height -
      5 * age -
      161;
  }


  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725
  };


  const activity =
    String(
      profile.activityLevel || "sedentary"
    ).toLowerCase();


  const multiplier =
    activityMultipliers[activity] || 1.2;


  const tdee =
    bmr * multiplier;


  let calories = tdee;


  const goal =
    String(profile.goal || "")
      .toLowerCase();


  if (
    goal.includes("loss") ||
    goal.includes("lose")
  ) {
    calories = tdee - 300;
  }


  if (
    goal.includes("gain") ||
    goal.includes("gain weight")
  ) {
    calories = tdee + 250;
  }


  calories = Math.max(
    Math.round(calories),
    1200
  );


  const protein =
    Math.round(
      (calories * 0.20) / 4
    );


  const carbs =
    Math.round(
      (calories * 0.50) / 4
    );


  const fat =
    Math.round(
      (calories * 0.30) / 9
    );


  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calories,
    protein,
    carbs,
    fat
  };
}


/* -----------------------------------------------------
   TODAY'S FOOD
----------------------------------------------------- */

function getTodayFoods() {

  const foods =
    JSON.parse(
      localStorage.getItem("foodEntries")
    ) || [];

  return foods.filter((food) =>
    isToday(food.date)
  );
}


/* -----------------------------------------------------
   TODAY'S ACTIVITY
----------------------------------------------------- */

function getTodayActivities() {

  const activities =
    JSON.parse(
      localStorage.getItem("activityLogs")
    ) || [];

  return activities.filter((activity) =>
    isToday(activity.date)
  );
}


/* -----------------------------------------------------
   FOOD TOTALS
----------------------------------------------------- */

function calculateFoodTotals(foods) {

  return foods.reduce(
    (total, food) => {

      total.calories +=
        Number(food.calories) || 0;

      total.protein +=
        Number(food.protein) || 0;

      total.carbs +=
        Number(food.carbs) || 0;

      total.fat +=
        Number(food.fat) || 0;

      return total;

    },
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    }
  );
}


/* -----------------------------------------------------
   ACTIVITY TOTALS
----------------------------------------------------- */

function calculateActivityTotals(
  activities
) {

  return activities.reduce(
    (total, activity) => {

      total.minutes +=
        Number(activity.duration) || 0;

      total.calories +=
        Number(
          activity.caloriesBurned
        ) || 0;

      return total;

    },
    {
      minutes: 0,
      calories: 0
    }
  );
}


/* -----------------------------------------------------
   REMAINING REQUIREMENTS
----------------------------------------------------- */

function calculateRemaining(
  consumed,
  requirements
) {

  return {
    calories: Math.max(
      requirements.calories -
        consumed.calories,
      0
    ),

    protein: Math.max(
      requirements.protein -
        consumed.protein,
      0
    ),

    carbs: Math.max(
      requirements.carbs -
        consumed.carbs,
      0
    ),

    fat: Math.max(
      requirements.fat -
        consumed.fat,
      0
    )
  };
}


/* -----------------------------------------------------
   NUTRITION PERCENTAGES
----------------------------------------------------- */

function calculatePercentages(
  consumed,
  requirements
) {

  return {
    calories:
      requirements.calories > 0
        ? Math.round(
            (consumed.calories /
              requirements.calories) *
              100
          )
        : 0,

    protein:
      requirements.protein > 0
        ? Math.round(
            (consumed.protein /
              requirements.protein) *
              100
          )
        : 0,

    carbs:
      requirements.carbs > 0
        ? Math.round(
            (consumed.carbs /
              requirements.carbs) *
              100
          )
        : 0,

    fat:
      requirements.fat > 0
        ? Math.round(
            (consumed.fat /
              requirements.fat) *
              100
          )
        : 0
  };
}


/* -----------------------------------------------------
   MANAGEMENT SUGGESTIONS
----------------------------------------------------- */

function generateManagement(
  consumed,
  requirements,
  activity
) {

  const suggestions = [];

  const remaining =
    calculateRemaining(
      consumed,
      requirements
    );


  /* Calories */

  if (
    consumed.calories >
    requirements.calories
  ) {

    suggestions.push({
      type: "reduce",
      icon: "⚠️",
      title: "Calories are above target",
      text:
        "Your estimated calorie intake has reached or exceeded today's target. Prefer lighter foods for the rest of the day and avoid unnecessary high-calorie snacks."
    });

  } else if (
    remaining.calories > 400
  ) {

    suggestions.push({
      type: "add",
      icon: "🍽️",
      title: "Calories are still available",
      text:
        `Approximately ${Math.round(
          remaining.calories
        )} kcal remain within today's estimated target. Choose a balanced meal rather than skipping food.`
    });

  } else {

    suggestions.push({
      type: "maintain",
      icon: "✅",
      title: "Calories are close to target",
      text:
        "Your calorie intake is relatively close to today's estimated requirement. Focus on balanced food choices for the remaining meals."
    });

  }


  /* Protein */

  if (
    consumed.protein <
    requirements.protein * 0.6
  ) {

    suggestions.push({
      type: "protein",
      icon: "💪",
      title: "Protein needs attention",
      text:
        "Your protein intake is relatively low compared with your estimated daily target. Consider protein-containing foods such as dal, beans, eggs, curd, paneer, tofu or other suitable options."
    });

  }


  /* Fat */

  if (
    consumed.fat >
    requirements.fat * 0.9
  ) {

    suggestions.push({
      type: "reduce",
      icon: "🥗",
      title: "Be careful with high-fat foods",
      text:
        "Your fat intake is already close to the estimated daily target. Prefer less-oily preparation and lighter food choices for the next meal."
    });

  }


  /* Carbohydrates */

  if (
    consumed.carbs >
    requirements.carbs * 0.95
  ) {

    suggestions.push({
      type: "reduce",
      icon: "🍚",
      title: "Carbohydrates are near target",
      text:
        "Your carbohydrate intake is already close to the estimated target. Consider vegetables and protein-rich foods rather than adding another large carbohydrate-heavy serving."
    });

  }


  /* Activity */

  if (
    activity.minutes === 0
  ) {

    suggestions.push({
      type: "activity",
      icon: "🏃",
      title: "No activity logged today",
      text:
        "No exercise has been recorded today. If appropriate for you, consider adding some regular physical activity and record it in the Activity Tracker."
    });

  } else {

    suggestions.push({
      type: "activity",
      icon: "🏃",
      title: "Activity recorded",
      text:
        `You have logged ${activity.minutes} minutes of activity today, with an estimated ${Math.round(
          activity.calories
        )} kcal burned.`
    });

  }


  return suggestions;
}


/* -----------------------------------------------------
   NEXT MEAL RECOMMENDATION
----------------------------------------------------- */

function generateNextMealRecommendation(
  consumed,
  requirements
) {

  const remaining =
    calculateRemaining(
      consumed,
      requirements
    );


  const recommendations = [];


  if (
    remaining.protein >
    requirements.protein * 0.25
  ) {

    recommendations.push(
      "Choose a protein-rich option such as dal, beans, eggs, curd, paneer or tofu."
    );

  }


  if (
    remaining.calories > 350
  ) {

    recommendations.push(
      "You have room for a balanced meal. Combine a suitable protein source with vegetables and an appropriate carbohydrate portion."
    );

  } else if (
    remaining.calories > 0
  ) {

    recommendations.push(
      "Keep the next meal relatively light because your remaining calorie allowance is limited."
    );

  }


  if (
    remaining.fat <
    requirements.fat * 0.15
  ) {

    recommendations.push(
      "Prefer less-oily preparation because your remaining fat allowance is relatively small."
    );

  }


  if (
    remaining.carbs <
    requirements.carbs * 0.15
  ) {

    recommendations.push(
      "Prefer vegetables and protein-rich foods rather than a large carbohydrate-heavy meal."
    );

  }


  if (
    recommendations.length === 0
  ) {

    recommendations.push(
      "Choose a balanced meal based on your remaining calorie and nutrient requirements."
    );

  }


  return recommendations;
}


/* -----------------------------------------------------
   WEIGHT LOG
----------------------------------------------------- */

function getWeightLogs() {

  return (
    JSON.parse(
      localStorage.getItem("weightLogs")
    ) || []
  );
}


function getLatestWeight() {

  const logs =
    getWeightLogs();

  if (logs.length === 0) {
    return null;
  }

  const sorted = [...logs].sort(
    (a, b) =>
      new Date(b.date) -
      new Date(a.date)
  );

  return sorted[0];
}


/* -----------------------------------------------------
   WEEKLY DATA
----------------------------------------------------- */

function getWeeklyFoods() {

  const foods =
    JSON.parse(
      localStorage.getItem("foodEntries")
    ) || [];

  return foods.filter((food) =>
    isWithinLastDays(
      food.date,
      7
    )
  );
}


function getWeeklyActivities() {

  const activities =
    JSON.parse(
      localStorage.getItem("activityLogs")
    ) || [];

  return activities.filter(
    (activity) =>
      isWithinLastDays(
        activity.date,
        7
      )
  );
}


function calculateWeeklySummary(
  requirements
) {

  const foods =
    getWeeklyFoods();

  const activities =
    getWeeklyActivities();

  const foodTotals =
    calculateFoodTotals(foods);

  const activityTotals =
    calculateActivityTotals(
      activities
    );


  const averageCalories =
    foods.length > 0
      ? Math.round(
          foodTotals.calories /
            7
        )
      : 0;


  const averageProtein =
    foods.length > 0
      ? Number(
          (
            foodTotals.protein /
            7
          ).toFixed(1)
        )
      : 0;


  const activeDays =
    new Set(
      activities.map(
        (activity) =>
          new Date(
            activity.date
          ).toDateString()
      )
    ).size;


  return {
    totalFoods: foods.length,

    totalCalories:
      Math.round(
        foodTotals.calories
      ),

    averageCalories,

    totalProtein:
      Number(
        foodTotals.protein.toFixed(1)
      ),

    averageProtein,

    totalCarbs:
      Number(
        foodTotals.carbs.toFixed(1)
      ),

    totalFat:
      Number(
        foodTotals.fat.toFixed(1)
      ),

    activityMinutes:
      activityTotals.minutes,

    activityCalories:
      Math.round(
        activityTotals.calories
      ),

    activeDays,

    calorieTarget:
      requirements.calories
  };
}


/* -----------------------------------------------------
   EXPORTS
----------------------------------------------------- */

export {
  calculateRequirements,
  getTodayFoods,
  getTodayActivities,
  calculateFoodTotals,
  calculateActivityTotals,
  calculateRemaining,
  calculatePercentages,
  generateManagement,
  generateNextMealRecommendation,
  getWeightLogs,
  getLatestWeight,
  calculateWeeklySummary
};