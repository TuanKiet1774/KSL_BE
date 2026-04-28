const express = require("express");
const router = express.Router();
const {
    addToFavorite,
    getMyFavorites,
    updateFavorite,
    removeFromFavorite,
    removeFromFavoriteByWordId
} = require("../controllers/favoriteWord.controller");

router.route("/")
    .get(getMyFavorites)
    .post(addToFavorite);

router.delete("/word/:wordId", removeFromFavoriteByWordId);

router.route("/:id")
    .put(updateFavorite)
    .delete(removeFromFavorite);

module.exports = router;
