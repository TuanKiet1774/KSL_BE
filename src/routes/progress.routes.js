const express = require("express");
const router = express.Router();
const progressController = require("../controllers/progress.controller");

router.get("/:userId", progressController.getProgress);
router.post("/complete-lesson", progressController.completeLesson);
router.post("/learn-word", progressController.learnWord);
router.post("/answer-question", progressController.answerQuestion);

module.exports = router;
