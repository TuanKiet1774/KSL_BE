const express = require("express");
const router = express.Router();
const progressController = require("../controllers/progress.controller");

router.get("/", progressController.getMyProgress);
router.get("/:userId", progressController.getProgress);
router.post("/learn-word", progressController.learnWord);
router.post("/update-learning-time", progressController.updateLearningTime);

module.exports = router;
