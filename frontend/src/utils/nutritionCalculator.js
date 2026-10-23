function calculateBMR(profile) {
  const age = Number(profile.age);
  const height = Number(profile.height);
  const weight = Number(profile.weight);

  let bmr;

  /*
    Mifflin-St Jeor equation

    Male:
    BMR = 10W + 6.25H - 5A + 5

    Female:
    BMR = 10W + 6.25H - 5A - 161
  */

  if (profile.gender === "male") {
    bmr =
      (10 * weight) +
      (6.25 * height) -
      (5 * age) +
      5;
  } else {
    bmr =
      (10 * weight) +
      (6.25 * height) -
      (5 * age) -
      161;
  }

  return Math.round(bmr);
}


function getActivityMultiplier(activityLevel) {

  const activityMultipliers = {

    sedentary: 1.2,

    light: 1.375,

    moderate: 1.55,

    active: 1.725

  };

  return activityMultipliers[activityLevel] || 1.2;
}


function calculateTDEE(bmr, activityLevel) {

  const multiplier =
    getActivityMultiplier(activityLevel);

  return Math.round(bmr * multiplier);
}


function calculateCalorieTarget(tdee, goal) {

  let target = tdee;

  /*
    We use modest adjustments for the
    application's estimated planning target.
  */

  if (goal === "weight-loss") {

    target = tdee - 300;

  } else if (goal === "maintain") {

    target = tdee;

  } else if (goal === "healthy") {

    target = tdee;

  }

  return Math.max(Math.round(target), 1200);
}


function calculateMacroTargets(calories) {

  /*
    Initial application targets:

    Protein = 20%
    Carbohydrates = 50%
    Fat = 30%

    Calories per gram:
    Protein = 4
    Carbs = 4
    Fat = 9
  */

  const proteinCalories = calories * 0.20;
  const carbCalories = calories * 0.50;
  const fatCalories = calories * 0.30;

  const protein = Math.round(
    proteinCalories / 4
  );

  const carbs = Math.round(
    carbCalories / 4
  );

  const fat = Math.round(
    fatCalories / 9
  );

  return {
    protein,
    carbs,
    fat
  };
}


function calculateNutritionRequirements(profile) {

  const bmr = calculateBMR(profile);

  const tdee = calculateTDEE(
    bmr,
    profile.activityLevel
  );

  const calories = calculateCalorieTarget(
    tdee,
    profile.goal
  );

  const macros = calculateMacroTargets(
    calories
  );

  return {

    bmr,

    tdee,

    calories,

    protein: macros.protein,

    carbs: macros.carbs,

    fat: macros.fat

  };
}


export {
  calculateBMR,
  calculateTDEE,
  calculateNutritionRequirements
};