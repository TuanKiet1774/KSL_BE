const express = require("express");
const router = express.Router();
const progressController = require("../controllers/progress.controller");

router.get("/:userId", progressController.getProgress);
router.post("/complete-topic", progressController.completeTopic);
router.post("/learn-word", progressController.learnWord);

module.exports = router;
