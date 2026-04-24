const express = require("express");
const router = express.Router();
const { getMyLearnedWords, getLearnedStats, learnWord, deleteLearnedWord, deleteBulkLearnedWords, syncExp } = require("../controllers/learnedWord.controller");

router.route("/")
    .get(getMyLearnedWords)
    .post(learnWord);

router.post("/sync-exp", syncExp);
router.delete("/bulk", deleteBulkLearnedWords);
router.delete("/:id", deleteLearnedWord);

router.get("/stats", getLearnedStats);

module.exports = router;
