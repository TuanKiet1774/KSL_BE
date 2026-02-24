const express = require("express");
const router = express.Router();
const examController = require("../controllers/exam.controller");

router.route("/")
    .get(examController.getExams)     // Lấy danh sách đề thi
    .post(examController.createExam); // Tạo đề thi mới (Admin)

router.post("/submit", examController.submitExamResult); // Nộp bài làm (User)
router.get("/user/:userId", examController.getUserResults); // Lấy lịch sử thi của user

router.route("/:id")
    .get(examController.getExamById)
    .put(examController.updateExam)
    .delete(examController.deleteExam);

module.exports = router;
