const express = require("express");
const router = express.Router();
const {
    addToFavorite,
    getMyFavorites,
    updateFavorite,
    removeFromFavorite
} = require("../controllers/favoriteWord.controller");

router.route("/")
    .get(getMyFavorites)
    .post(addToFavorite);

router.route("/:id")
    .put(updateFavorite)
    .delete(removeFromFavorite);

module.exports = router;
