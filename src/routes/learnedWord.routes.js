const express = require("express");
const router = express.Router();
const { getMyLearnedWords, getLearnedStats, learnWord } = require("../controllers/learnedWord.controller");

router.route("/")
    .get(getMyLearnedWords)
    .post(learnWord);

router.get("/stats", getLearnedStats);

module.exports = router;
