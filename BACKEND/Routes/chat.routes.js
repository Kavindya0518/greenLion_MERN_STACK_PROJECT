const express = require('express');
const router = express.Router();
const { askChat } = require('../Controllers/chat.controller');

// Basic rate limit (very simple, per-process memory). Adjust as needed.
let lastCall = 0;
router.post('/ask', async (req, res, next) => {
  const now = Date.now();
  if (now - lastCall < 400) {
    return res.status(429).json({ ok: false, message: 'Too many requests. Please wait a moment.' });
  }
  lastCall = now;
  return askChat(req, res, next);
});

module.exports = router;
