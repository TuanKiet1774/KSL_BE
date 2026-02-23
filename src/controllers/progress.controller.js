const Progress = require("../models/Progress");

// Lấy tiến độ của người dùng hiện tại
exports.getProgress = async (req, res) => {
    try {
        let progress = await Progress.findOne({ userId: req.params.userId })
            .populate("completedLessons.lessonId")
            .populate("learnedWords.wordId")
            .populate("questionHistory.questionId");

        if (!progress) {
            // Nếu chưa có thì tạo mới
            progress = await Progress.create({ userId: req.params.userId });
        }

        res.status(200).json({
            success: true,
            data: progress
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Cập nhật khi hoàn thành bài học
exports.completeLesson = async (req, res) => {
    try {
        const { userId, lessonId } = req.body;
        const progress = await Progress.findOneAndUpdate(
            { userId },
            { $addToSet: { completedLessons: { lessonId } } },
            { new: true, upsert: true }
        );
        res.status(200).json({ success: true, data: progress });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Cập nhật khi học từ mới
exports.learnWord = async (req, res) => {
    try {
        const { userId, wordId } = req.body;
        const progress = await Progress.findOneAndUpdate(
            { userId },
            { $addToSet: { learnedWords: { wordId } } },
            { new: true, upsert: true }
        );
        res.status(200).json({ success: true, data: progress });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Lưu lịch sử làm câu hỏi
exports.answerQuestion = async (req, res) => {
    try {
        const { userId, questionId, isCorrect, pointsEarned } = req.body;
        const progress = await Progress.findOneAndUpdate(
            { userId },
            {
                $push: { questionHistory: { questionId, isCorrect, pointsEarned } },
                $inc: { "stats.totalPoints": pointsEarned || 0 }
            },
            { new: true, upsert: true }
        );
        res.status(200).json({ success: true, data: progress });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
