const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    // Lưu các chủ đề đã hoàn thành
    completedTopics: [{
        topicId: { type: mongoose.Schema.Types.ObjectId, ref: "Topic" },
        completedAt: { type: Date, default: Date.now }
    }],
    // Lưu các từ vựng đã học
    learnedWords: [{
        wordId: { type: mongoose.Schema.Types.ObjectId, ref: "Word" },
        learnedAt: { type: Date, default: Date.now }
    }],
    // Lưu lịch sử các bài kiểm tra đã làm
    completedExams: [{
        examId: { type: mongoose.Schema.Types.ObjectId, ref: "Exam" },
        resultId: { type: mongoose.Schema.Types.ObjectId, ref: "ExamResult" },
        score: { type: Number, default: 0 },
        completedAt: { type: Date, default: Date.now }
    }],
    // Tổng kết nhanh để hiển thị streak hoặc thống kê
    stats: {
        totalExp: { type: Number, default: 0 },
        streakDays: { type: Number, default: 0 },
        lastActivity: { type: Date, default: Date.now }
    }
}, { timestamps: true });


progressSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model("Progress", progressSchema);
