const Progress = require("../models/Progress");
const Word = require("../models/Word");
const User = require("../models/User");
const LearnedWord = require("../models/LearnedWord");

exports.getMyProgress = async (req, res) => {
    try {
        const userId = req.user._id;

        let progress = await Progress.findOne({ userId })
            .populate("topicProgress.topicId");

        if (!progress) {
            progress = await Progress.create({ userId });
        }

        const totalWordsLearned = await LearnedWord.countDocuments({ userId });
        const user = await User.findById(userId);
        
        let needsSave = false;

        if (progress.stats.totalWordsLearned !== totalWordsLearned) {
            progress.stats.totalWordsLearned = totalWordsLearned;
            needsSave = true;
        }
        if (user && progress.stats.totalExp !== user.exp) {
            progress.stats.totalExp = user.exp;
            needsSave = true;
        }

        const actualTopicStats = await LearnedWord.aggregate([
            { $match: { userId: progress.userId } },
            { $group: { _id: "$topicId", count: { $sum: 1 } } }
        ]);

        const statsMap = {};
        actualTopicStats.forEach(stat => {
            if (stat._id) {
                statsMap[stat._id.toString()] = stat.count;
            }
        });

        // 1. Cập nhật hoặc xoá các topic hiện có trong progress.topicProgress
        for (let i = progress.topicProgress.length - 1; i >= 0; i--) {
            const tp = progress.topicProgress[i];
            if (!tp.topicId) {
                progress.topicProgress.splice(i, 1);
                needsSave = true;
                continue;
            }
            
            const tId = tp.topicId.toString();
            const actualCount = statsMap[tId] || 0;

            if (actualCount === 0) {
                progress.topicProgress.splice(i, 1);
                needsSave = true;
            } else if (tp.learnedWordsCount !== actualCount) {
                try {
                    const topic = await mongoose.model("Topic").findById(tp.topicId);
                    const totalInTopic = topic ? topic.totalWord : 0;
                    
                    tp.learnedWordsCount = actualCount;
                    tp.percentage = totalInTopic > 0 ? (actualCount / totalInTopic) * 100 : 0;
                    tp.lastUpdated = Date.now();
                    needsSave = true;
                } catch (err) {
                    console.error("Lỗi khi đồng bộ topic:", err);
                }
            }
            delete statsMap[tId];
        }

        // 2. Thêm các topic mới
        for (const [tId, count] of Object.entries(statsMap)) {
            try {
                const topic = await mongoose.model("Topic").findById(tId);
                if (topic) {
                    const totalInTopic = topic.totalWord || 0;
                    progress.topicProgress.push({
                        topicId: tId,
                        learnedWordsCount: count,
                        percentage: totalInTopic > 0 ? (count / totalInTopic) * 100 : 0,
                        lastUpdated: Date.now()
                    });
                    needsSave = true;
                }
            } catch (err) {
                console.error("Lỗi khi thêm topic mới vào progress:", err);
            }
        }

        if (needsSave) {
            await progress.save();
        }

        const result = progress.toObject();
        if (result.stats) {
            result.stats.totalExp = Number(result.stats.totalExp || 0);
            result.stats.totalWordsLearned = Number(result.stats.totalWordsLearned || 0);
            result.stats.streakDays = Number(result.stats.streakDays || 0);
            result.stats.totalLearningMinutes = Number(result.stats.totalLearningMinutes || 0);
        }

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getProgress = async (req, res) => {
    try {
        let progress = await Progress.findOne({ userId: req.params.userId })
            .populate("topicProgress.topicId");

        if (!progress) {
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


exports.learnWord = async (req, res) => {
    try {
        const userId = req.user._id;
        const { wordId } = req.body;

        const word = await Word.findById(wordId);
        if (!word) {
            return res.status(404).json({ success: false, message: "Từ vựng không tồn tại" });
        }

        const existingRecord = await LearnedWord.findOne({ userId, wordId });
        if (existingRecord) {
            return res.status(400).json({
                success: false,
                message: "Bạn đã học từ này rồi"
            });
        }

        const expGain = word.exp || 5;

        await LearnedWord.create({
            userId,
            wordId,
            topicId: word.topicId,
            expGained: expGain,
            learnedAt: Date.now()
        });

        await User.findByIdAndUpdate(userId, { $inc: { exp: expGain } });

        await Progress.findOneAndUpdate(
            { userId },
            { $inc: { "stats.totalExp": expGain } },
            { upsert: true }
        );

        res.status(200).json({
            success: true,
            message: `Học thành công! +${expGain} EXP`
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

