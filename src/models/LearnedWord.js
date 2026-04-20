const mongoose = require("mongoose");

const learnedWordSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    wordId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Word",
        required: true
    },
    topicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Topic",
        required: true,
        index: true
    },
    expGained: {
        type: Number,
        default: 0
    },
    learnedAt: {
        type: Date,
        default: Date.now
    },
    lastReviewed: {
        type: Date,
        default: Date.now
    }
}, { 
    timestamps: true 
});

learnedWordSchema.index({ userId: 1, wordId: 1 }, { unique: true });

// Tự động cập nhật topicProgress trong Progress sau mỗi lần học từ mới
learnedWordSchema.post("save", async function (doc) {
    try {
        const { userId, topicId } = doc;

        // Đếm số từ đã học của user trong topic này
        const learnedWordsCount = await mongoose.model("LearnedWord").countDocuments({ userId, topicId });

        // Lấy tổng số từ của topic
        const topic = await mongoose.model("Topic").findById(topicId);
        const totalWords = topic ? topic.totalWord : 0;
        const percentage = totalWords > 0 ? (learnedWordsCount / totalWords) * 100 : 0;

        // Cập nhật hoặc thêm mới topicProgress trong Progress
        const progress = await mongoose.model("Progress").findOneAndUpdate(
            { userId },
            { $set: { "stats.lastActivity": Date.now() } },
            { upsert: true, new: true }
        );

        const topicIndex = progress.topicProgress.findIndex(
            tp => tp.topicId.toString() === topicId.toString()
        );

        if (topicIndex > -1) {
            progress.topicProgress[topicIndex].learnedWordsCount = learnedWordsCount;
            progress.topicProgress[topicIndex].percentage = percentage;
            progress.topicProgress[topicIndex].lastUpdated = Date.now();
        } else {
            progress.topicProgress.push({ topicId, learnedWordsCount, percentage, lastUpdated: Date.now() });
        }

        await progress.save();
    } catch (err) {
        console.error("Error updating topicProgress after LearnedWord save:", err);
    }
});

module.exports = mongoose.model("LearnedWord", learnedWordSchema);
