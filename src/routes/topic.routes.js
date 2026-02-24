const express = require("express");
const router = express.Router();
const topicController = require("../controllers/topic.controller");
const { protect, authorize } = require("../middleware/authMiddleware");

router.route("/")
    .get(topicController.getTopics)
    .post(protect, authorize("admin"), topicController.createTopic);

router.route("/:id")
    .get(topicController.getTopicById)
    .put(protect, authorize("admin"), topicController.updateTopic)
    .delete(protect, authorize("admin"), topicController.deleteTopic);

module.exports = router;
