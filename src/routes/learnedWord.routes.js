const express = require("express");
const router = express.Router();
const { getMyLearnedWords, getLearnedStats } = require("../controllers/learnedWord.controller");

router.get("/", getMyLearnedWords);
router.get("/stats", getLearnedStats);

module.exports = router;
