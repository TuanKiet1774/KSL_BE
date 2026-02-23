const express = require("express");
const router = express.Router();
const examController = require("../controllers/exam.controller");

router.route("/")
    .get(examController.getExams)
    .post(examController.submitExam);

router.post("/submit", examController.submitExam);
router.get("/user/:userId", examController.getUserExams);

router.route("/:id")
    .get(examController.getExamById)
    .put(examController.updateExam)
    .delete(examController.deleteExam);

module.exports = router;
