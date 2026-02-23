const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    // Lưu các bài học đã hoàn thành
    completedLessons: [{
        lessonId: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" },
        completedAt: { type: Date, default: Date.now }
    }],
    // Lưu các từ vựng đã học
    learnedWords: [{
        wordId: { type: mongoose.Schema.Types.ObjectId, ref: "Word" },
        learnedAt: { type: Date, default: Date.now }
    }],
    // Lưu lịch sử làm câu hỏi
    questionHistory: [{
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
        isCorrect: { type: Boolean, required: true },
        chosenOptionId: { type: mongoose.Schema.Types.ObjectId },
        pointsEarned: { type: Number, default: 0 },
        answeredAt: { type: Date, default: Date.now }
    }],
    // Tổng kết nhanh để hiển thị streak hoặc thống kê
    stats: {
        totalPoints: { type: Number, default: 0 },
        totalExp: { type: Number, default: 0 },
        streakDays: { type: Number, default: 0 },
        lastActivity: { type: Date, default: Date.now }
    }
}, { timestamps: true });

// Mỗi user chỉ có 1 bản ghi Progress duy nhất để tối ưu truy vấn
progressSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model("Progress", progressSchema);
