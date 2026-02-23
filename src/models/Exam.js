const mongoose = require("mongoose");

const examSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    lessonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lesson",
        index: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
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
        type: Number, // Tính bằng giây
        default: 10
    },
    status: {
        type: String,
        enum: ["in-progress", "completed"],
        default: "completed"
    }
}, { timestamps: true });

examSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Exam", examSchema);
