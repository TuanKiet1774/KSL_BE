const express = require("express");
const router = express.Router();
const topicController = require("../controllers/topic.controller");

router.route("/")
    .get(topicController.getTopics)
    .post(topicController.createTopic);

router.route("/:id")
    .get(topicController.getTopicById)
    .put(topicController.updateTopic)
    .delete(topicController.deleteTopic);

module.exports = router;
