const express = require("express");

const {
  createUser,
  loginUser,
  getUser,
  updateUser
} = require("../controllers/userController");

const router = express.Router();

// Create account
router.post("/", createUser);

// Login
router.post("/login", loginUser);

// Get user
router.get("/:id", getUser);

// Update user
router.put("/:id", updateUser);

module.exports = router;