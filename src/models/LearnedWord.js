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

        // Cập nhật tổng số từ đã học (Across all topics)
        const totalWordsLearned = await mongoose.model("LearnedWord").countDocuments({ userId });
        progress.stats.totalWordsLearned = totalWordsLearned;

        // Đồng bộ tổng EXP từ User model
        const user = await mongoose.model("User").findById(userId);
        if (user) {
            progress.stats.totalExp = user.exp;
        }
        
        // Cập nhật streak
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

        progress.stats.lastActivity = Date.now();
        await progress.save();
    } catch (err) {
        console.error("Error updating topicProgress after LearnedWord save:", err);
    }
});

module.exports = mongoose.model("LearnedWord", learnedWordSchema);
