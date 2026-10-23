const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    activityType: {
      type: String,
      required: true
    },

    duration: {
      type: Number,
      required: true
    },

    calories: {
      type: Number,
      default: 0
    },

    date: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "Activity",
  activitySchema
);