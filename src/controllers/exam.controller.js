const Exam = require("../models/Exam");
const Progress = require("../models/Progress");
const User = require("../models/User");
const paginate = require("../utils/pagination");

// Lấy danh sách bài kiểm tra (có phân trang/tìm kiếm)
exports.getExams = async (req, res) => {
    try {
        const {
            userId,
            lessonId,
            status,
            page,
            limit,
            sortBy,
            sortOrder,
            search,
        } = req.query;

        const query = {};

        if (search) {
            query.title = { $regex: search, $options: "i" };
        }
        if (userId) {
            query.userId = userId;
        }
        if (lessonId) {
            query.lessonId = lessonId;
        }
        if (status) {
            query.status = status;
        }

        const result = await paginate(Exam, query, {
            page,
            limit,
            sortBy,
            sortOrder,
            populate: [
                { path: "userId", select: "fullname username" },
                { path: "lessonId", select: "name" }
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

// Tạo/Nộp bài kiểm tra
exports.submitExam = async (req, res) => {
    try {
        const { userId, lessonId, title, results, totalScore, maxScore, timeSpent } = req.body;

        const exam = await Exam.create({
            userId,
            lessonId,
            title,
            results,
            totalScore,
            maxScore,
            timeSpent,
            status: "completed"
        });

        // Cập nhật điểm và kinh nghiệm cho User
        await User.findByIdAndUpdate(userId, {
            $inc: { points: totalScore, exp: totalScore * 2 }
        });

        // Cập nhật vào Progress tổng quát
        await Progress.findOneAndUpdate(
            { userId },
            {
                $push: {
                    questionHistory: {
                        $each: results.map(r => ({
                            questionId: r.questionId,
                            isCorrect: r.isCorrect,
                            pointsEarned: r.points
                        }))
                    }
                },
                $inc: { "stats.totalPoints": totalScore }
            },
            { upsert: true }
        );

        res.status(201).json({
            success: true,
            data: exam
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Lấy chi tiết 1 bài kiểm tra
exports.getExamById = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id)
            .populate("results.questionId")
            .populate("lessonId")
            .populate("userId", "fullname username email");

        if (!exam) {
            return res.status(404).json({ success: false, message: "Exam not found" });
        }

        res.status(200).json({
            success: true,
            data: exam
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Cập nhật thông tin bài kiểm tra (Sửa thông tin cơ bản)
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

// Xóa bài kiểm tra
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

// Alias cho việc lấy exam theo user (tương thích backward)
exports.getUserExams = async (req, res) => {
    req.query.userId = req.params.userId;
    return this.getExams(req, res);
};
