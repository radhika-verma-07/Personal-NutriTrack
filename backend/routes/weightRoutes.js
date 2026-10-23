const express = require("express");

const {
  createWeight,
  getWeights,
  deleteWeight
} = require("../controllers/weightController");

const router = express.Router();

router.post("/", createWeight);

router.get(
  "/user/:userId",
  getWeights
);

router.delete(
  "/:id",
  deleteWeight
);

module.exports = router;