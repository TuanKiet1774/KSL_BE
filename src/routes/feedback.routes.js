const express = require("express");
const router = express.Router();
const {
    createFeedBack,
    getFeedBacks,
    getFeedBackById,
    deleteFeedBack,
} = require("../controllers/feedback.controller");

router.route("/")
    .get(getFeedBacks)
    .post(createFeedBack);

router.route("/:id")
    .get(getFeedBackById)
    .delete(deleteFeedBack);

module.exports = router;
