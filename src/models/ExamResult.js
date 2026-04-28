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

examResultSchema.post("save", async function (doc) {
    try {
        const { userId } = doc;
        const allResults = await mongoose.model("ExamResult").find({ userId });
        const validResults = allResults.filter(r => (r.maxScore || 0) > 0);
        const averageTestScore = validResults.length > 0
            ? validResults.reduce((acc, r) => acc + (r.totalScore / r.maxScore) * 10, 0) / validResults.length
            : 0;

        const progress = await mongoose.model("Progress").findOne({ userId });
        if (!progress) return;

        // Cập nhật streak logic
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastActivityDate = new Date(progress.stats.lastActivity);
        lastActivityDate.setHours(0, 0, 0, 0);

        if (today.getTime() > lastActivityDate.getTime()) {
            const diffTime = Math.abs(today - lastActivityDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                progress.stats.streakDays += 1;
            } else if (diffDays > 1) {
                progress.stats.streakDays = 1;
            }
            
            if (progress.stats.streakDays > progress.stats.maxStreak) {
                progress.stats.maxStreak = progress.stats.streakDays;
            }
        } else if (progress.stats.streakDays === 0) {
            progress.stats.streakDays = 1;
            progress.stats.maxStreak = Math.max(progress.stats.maxStreak, 1);
        }

        // Cập nhật điểm trung bình và thời gian học
        progress.averageTestScore = Math.round(averageTestScore * 100) / 100;
        progress.stats.totalLearningMinutes += Math.round((doc.timeSpent || 0) / 60 * 100) / 100;
        progress.stats.lastActivity = Date.now();

        await progress.save();
    } catch (err) {
        console.error("Error updating averageTestScore after ExamResult save:", err);
    }
});

module.exports = mongoose.model("ExamResult", examResultSchema);
