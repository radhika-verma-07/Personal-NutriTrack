const mongoose = require("mongoose");

const foodEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    foodName: {
      type: String,
      required: true
    },

    description: {
      type: String,
      default: ""
    },

    servingSize: {
      type: String,
      default: ""
    },

    mealType: {
      type: String,
      default: "Other"
    },

    calories: {
      type: Number,
      default: 0
    },

    protein: {
      type: Number,
      default: 0
    },

    carbs: {
      type: Number,
      default: 0
    },

    fat: {
      type: Number,
      default: 0
    },

    confidence: {
      type: Number,
      default: 0
    },

    image: {
      type: String,
      default: ""
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
  "FoodEntry",
  foodEntrySchema
);