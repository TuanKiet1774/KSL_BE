const mongoose = require("mongoose");

const examSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
        default: "",
    },
    questions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
        required: true
    }],
}, { timestamps: true });

examSchema.index({ createdAt: -1 });

examSchema.post("findOneAndDelete", async function (doc) {
    if (doc) {
        const examId = doc._id;
        try {
            // Tìm tất cả người dùng đã làm bài thi này
            const results = await mongoose.model("ExamResult").find({ examId });
            const userIds = [...new Set(results.map(r => r.userId.toString()))];

            // Xóa tất cả kết quả của bài thi này
            await mongoose.model("ExamResult").deleteMany({ examId });

            // Tính toán lại averageTestScore cho mỗi người dùng bị ảnh hưởng
            await Promise.all(userIds.map(async (userId) => {
                const allUserResults = await mongoose.model("ExamResult").find({ userId });
                const validResults = allUserResults.filter(r => (r.maxScore || 0) > 0);
                const averageTestScore = validResults.length > 0
                    ? validResults.reduce((acc, r) => acc + (r.totalScore / r.maxScore) * 100, 0) / validResults.length
                    : 0;

                await mongoose.model("Progress").findOneAndUpdate(
                    { userId },
                    { averageTestScore: Math.round(averageTestScore * 100) / 100 }
                );
            }));
            console.log(`Cascade delete completed for exam: ${doc.title}`);
        } catch (err) {
            console.error("Error in exam cascade delete:", err);
        }
    }
});

module.exports = mongoose.model("Exam", examSchema);
