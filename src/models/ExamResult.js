const mongoose = require("mongoose");

const examResultSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    examId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Exam",
        required: true,
        index: true,
    },
    results: [{
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
        userAnswer: { type: String, default: "" },
        chosenOptionId: { type: mongoose.Schema.Types.ObjectId },
        isCorrect: { type: Boolean, required: true },
        points: { type: Number, default: 0 }
    }],
    totalScore: {
        type: Number,
        default: 0
    },
    maxScore: {
        type: Number,
        default: 0
    },
    timeSpent: {
        type: Number, // In seconds
        default: 0
    },
    status: {
        type: String,
        enum: ["in-progress", "completed"],
        default: "completed"
    }
}, { timestamps: true });

examResultSchema.index({ userId: 1, examId: 1 });
examResultSchema.index({ createdAt: -1 });

module.exports = mongoose.model("ExamResult", examResultSchema);
