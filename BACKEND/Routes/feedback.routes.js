// backend/Routes/feedback.routes.js
const express = require("express");
const router = express.Router();
const feedbackCtrl = require("../Controllers/feedback.controller");

router.post("/", feedbackCtrl.createFeedback);
router.get("/", feedbackCtrl.getAllFeedbacks);
router.get("/:id", feedbackCtrl.getFeedbackById);
router.put("/:id", feedbackCtrl.updateFeedback);
router.delete("/:id", feedbackCtrl.deleteFeedback);

module.exports = router;