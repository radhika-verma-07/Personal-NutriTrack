const Activity = require("../models/Activity");

const createActivity = async (req, res) => {
  try {
    const activity =
      await Activity.create(req.body);

    res.status(201).json({
      success: true,
      activity
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getActivities = async (req, res) => {
  try {
    const activities =
      await Activity.find({
        userId: req.params.userId
      }).sort({ date: -1 });

    res.json({
      success: true,
      activities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const deleteActivity = async (req, res) => {
  try {
    await Activity.findByIdAndDelete(
      req.params.id
    );

    res.json({
      success: true,
      message: "Activity deleted"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  createActivity,
  getActivities,
  deleteActivity
};