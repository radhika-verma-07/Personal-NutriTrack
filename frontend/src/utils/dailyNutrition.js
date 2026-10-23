function getTodayFoodEntries() {
  const savedFoods =
    JSON.parse(localStorage.getItem("foodEntries")) || [];

  const today = new Date();

  return savedFoods.filter((food) => {
    const foodDate = new Date(food.date);

    return (
      foodDate.getDate() === today.getDate() &&
      foodDate.getMonth() === today.getMonth() &&
      foodDate.getFullYear() === today.getFullYear()
    );
  });
}

function calculateDailyNutrition(foodEntries) {
  return foodEntries.reduce(
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
      fat: 0
    }
  );
}

function calculateRemainingNutrition(
  consumed,
  requirements
) {
  return {
    calories: Math.max(
      requirements.calories - consumed.calories,
      0
    ),

    protein: Math.max(
      requirements.protein - consumed.protein,
      0
    ),

    carbs: Math.max(
      requirements.carbs - consumed.carbs,
      0
    ),

    fat: Math.max(
      requirements.fat - consumed.fat,
      0
    )
  };
}

function calculatePercentage(consumed, target) {
  if (!target || target <= 0) {
    return 0;
  }

  return Math.min(
    Math.round((consumed / target) * 100),
    100
  );
}

export {
  getTodayFoodEntries,
  calculateDailyNutrition,
  calculateRemainingNutrition,
  calculatePercentage
};