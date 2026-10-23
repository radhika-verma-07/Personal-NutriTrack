const express = require("express");

const {
  createFood,
  getFoods,
  deleteFood
} = require("../controllers/foodController");

const router = express.Router();

router.post("/", createFood);

router.get("/user/:userId", getFoods);

router.delete("/:id", deleteFood);

module.exports = router;