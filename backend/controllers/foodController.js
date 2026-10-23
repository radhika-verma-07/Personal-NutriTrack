const FoodEntry = require("../models/FoodEntry");

const createFood = async (req, res) => {
  try {
    const food = await FoodEntry.create(
      req.body
    );

    res.status(201).json({
      success: true,
      food
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getFoods = async (req, res) => {
  try {
    const foods = await FoodEntry.find({
      userId: req.params.userId
    }).sort({ date: -1 });

    res.json({
      success: true,
      foods
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const deleteFood = async (req, res) => {
  try {
    await FoodEntry.findByIdAndDelete(
      req.params.id
    );

    res.json({
      success: true,
      message: "Food entry deleted"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  createFood,
  getFoods,
  deleteFood
};