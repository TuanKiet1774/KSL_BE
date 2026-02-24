const Exam = require("../models/Exam");
const ExamResult = require("../models/ExamResult");
const Progress = require("../models/Progress");
const User = require("../models/User");
const paginate = require("../utils/pagination");

/**
 * @desc    Lấy danh sách các đề thi (Definitions)
 * @route   GET /api/exams
 */
exports.getExams = async (req, res) => {
    try {
        const {
            topicId,
            page,
            limit,
            sortBy,
            sortOrder,
            search,
        } = req.query;

        const query = { isActive: true };

        if (search) {
            query.title = { $regex: search, $options: "i" };
        }
        if (topicId) {
            query.topicId = topicId;
        }

        const result = await paginate(Exam, query, {
            page,
            limit,
            sortBy,
            sortOrder,
            populate: [
                { path: "topicId", select: "name" }
            ],
        });

        res.status(200).json({
            success: true,
            count: result.data.length,
            ...result,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Tạo đề thi mới (Admin)
 * @route   POST /api/exams
 */
exports.createExam = async (req, res) => {
    try {
        const exam = await Exam.create(req.body);
        res.status(201).json({
            success: true,
            data: exam,
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Lấy chi tiết đề thi kèm danh sách câu hỏi
 * @route   GET /api/exams/:id
 */
exports.getExamById = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id)
            .populate("questions")
            .populate("topicId", "name");

        if (!exam) {
            return res.status(404).json({ success: false, message: "Exam (test definition) not found" });
        }

        res.status(200).json({
            success: true,
            data: exam
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Cập nhật đề thi
 * @route   PUT /api/exams/:id
 */
exports.updateExam = async (req, res) => {
    try {
        const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!exam) {
            return res.status(404).json({ success: false, message: "Exam not found" });
        }

        res.status(200).json({ success: true, data: exam });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Xóa đề thi
 * @route   DELETE /api/exams/:id
 */
exports.deleteExam = async (req, res) => {
    try {
        const exam = await Exam.findByIdAndDelete(req.params.id);
        if (!exam) {
            return res.status(404).json({ success: false, message: "Exam not found" });
        }
        res.status(200).json({ success: true, message: "Exam deleted successfully" });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// --- LOGIC CHO KẾT QUẢ THI (EXAM RESULTS) ---

/**
 * @desc    Nộp bài làm (User nộp bài sau khi thi xong)
 * @route   POST /api/exams/submit
 */
exports.submitExamResult = async (req, res) => {
    try {
        const { userId, examId, results, totalScore, maxScore, timeSpent } = req.body;

        // Lấy thông tin đề thi để lấy topicId
        const exam = await Exam.findById(examId);
        const topicId = exam ? exam.topicId : null;

        const examResult = await ExamResult.create({
            userId,
            examId,
            results,
            totalScore,
            maxScore,
            timeSpent,
            status: "completed"
        });

        // Cập nhật kinh nghiệm cho User (Dùng điểm số làm EXP)
        await User.findByIdAndUpdate(userId, {
            $inc: { exp: totalScore }
        });

        // Cập nhật vào Progress tổng quát
        const progressUpdate = {
            $push: {
                completedExams: {
                    examId: examId,
                    resultId: examResult._id,
                    score: totalScore,
                    completedAt: Date.now()
                }
            },
            $inc: { "stats.totalExp": totalScore }
        };

        // Nếu điểm số >= 80% điểm tối đa, coi như hoàn thành Topic
        if (topicId && totalScore >= maxScore * 0.8) {
            progressUpdate.$addToSet = {
                completedTopics: {
                    topicId: topicId,
                    completedAt: Date.now()
                }
            };
        }

        await Progress.findOneAndUpdate(
            { userId },
            progressUpdate,
            { upsert: true }
        );

        res.status(201).json({
            success: true,
            data: examResult
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Lấy lịch sử thi của người dùng
 * @route   GET /api/exams/user/:userId
 */
exports.getUserResults = async (req, res) => {
    try {
        const results = await ExamResult.find({ userId: req.params.userId })
            .populate("examId", "title")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: results
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
