// BACKEND/Routes/auth.routes.js
const express = require("express");
const { signup, login } = require("../Controllers/AuthController"); // CJS import

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);

module.exports = router;
