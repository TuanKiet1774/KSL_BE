const express = require("express");
const router = express.Router();
const lessonController = require("../controllers/lesson.controller");

router.route("/")
    .get(lessonController.getLessons)
    .post(lessonController.createLesson);

router.route("/:id")
    .get(lessonController.getLessonById)
    .put(lessonController.updateLesson)
    .delete(lessonController.deleteLesson);

module.exports = router;
