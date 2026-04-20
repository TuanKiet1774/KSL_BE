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
}, { timestamps: true });

examResultSchema.index({ userId: 1, examId: 1 });
examResultSchema.index({ createdAt: -1 });

// Tự động tính lại averageTestScore trong Progress sau mỗi lần nộp bài thi
examResultSchema.post("save", async function (doc) {
    try {
        const { userId } = doc;

        // Lấy tất cả kết quả thi của user, lọc những bài có maxScore > 0
        const allResults = await mongoose.model("ExamResult").find({ userId });
        const validResults = allResults.filter(r => (r.maxScore || 0) > 0);

        // Trung bình cộng: (totalScore / maxScore) * 10 cho từng bài, rồi lấy avg
        const averageTestScore = validResults.length > 0
            ? validResults.reduce((acc, r) => acc + (r.totalScore / r.maxScore) * 10, 0) / validResults.length
            : 0;

        await mongoose.model("Progress").findOneAndUpdate(
            { userId },
            {
                $set: {
                    averageTestScore: Math.round(averageTestScore * 100) / 100, // làm tròn 2 chữ số
                    "stats.lastActivity": Date.now()
                }
            },
            { upsert: true }
        );
    } catch (err) {
        console.error("Error updating averageTestScore after ExamResult save:", err);
    }
});

module.exports = mongoose.model("ExamResult", examResultSchema);
