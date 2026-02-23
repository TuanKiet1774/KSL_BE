const express = require("express");
const router = express.Router();
const wordController = require("../controllers/word.controller");

router.route("/")
    .get(wordController.getWords)
    .post(wordController.createWord);

router.route("/:id")
    .get(wordController.getWordById)
    .put(wordController.updateWord)
    .delete(wordController.deleteWord);

module.exports = router;
