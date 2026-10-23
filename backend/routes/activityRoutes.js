const express = require("express");

const {
  createActivity,
  getActivities,
  deleteActivity
} = require("../controllers/activityController");

const router = express.Router();

router.post("/", createActivity);

router.get(
  "/user/:userId",
  getActivities
);

router.delete(
  "/:id",
  deleteActivity
);

module.exports = router;