const express = require("express");
const router = express.Router();
const examController = require("../controllers/exam.controller");

router.route("/")
    .get(examController.getExams)  
    .post(examController.createExam);

router.post("/submit", examController.submitExamResult); 
router.get("/user/:userId", examController.getUserResults); 

router.route("/:id")
    .get(examController.getExamById)
    .put(examController.updateExam)
    .delete(examController.deleteExam);

module.exports = router;
