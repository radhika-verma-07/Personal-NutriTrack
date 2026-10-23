const WeightLog = require("../models/WeightLog");
const User = require("../models/User");

const createWeight = async (req, res) => {
  try {
    const {
      userId,
      weight
    } = req.body;

    const weightLog =
      await WeightLog.create({
        userId,
        weight
      });

    // Automatically update current user weight
    await User.findByIdAndUpdate(
      userId,
      { weight },
      { new: true }
    );

    res.status(201).json({
      success: true,
      weightLog
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getWeights = async (req, res) => {
  try {
    const weights =
      await WeightLog.find({
        userId: req.params.userId
      }).sort({ date: -1 });

    res.json({
      success: true,
      weights
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const deleteWeight = async (req, res) => {
  try {
    await WeightLog.findByIdAndDelete(
      req.params.id
    );

    res.json({
      success: true,
      message: "Weight record deleted"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  createWeight,
  getWeights,
  deleteWeight
};