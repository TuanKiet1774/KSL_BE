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

        const mongoose = require("mongoose");
        const actualTopicStats = await LearnedWord.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            { $group: { _id: "$topicId", count: { $sum: 1 } } }
        ]);

        const statsMap = {};
        actualTopicStats.forEach(stat => {
            if (stat._id) {
                statsMap[stat._id.toString()] = stat.count;
            }
        });

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
                    const totalWordsInTopic = await mongoose.model("Word").countDocuments({ topicId: tp.topicId });
                    
                    tp.learnedWordsCount = actualCount;
                    tp.percentage = totalWordsInTopic > 0 ? (actualCount / totalWordsInTopic) * 100 : 0;
                    tp.lastUpdated = Date.now();
                    needsSave = true;
                } catch (err) {
                    console.error("Lỗi khi đồng bộ topic:", err);
                }
            }
            delete statsMap[tId];
        }

        for (const [tId, count] of Object.entries(statsMap)) {
            try {
                const totalWordsInTopic = await mongoose.model("Word").countDocuments({ topicId: tId });
                if (totalWordsInTopic > 0 || count > 0) {
                    progress.topicProgress.push({
                        topicId: tId,
                        learnedWordsCount: count,
                        percentage: totalWordsInTopic > 0 ? (count / totalWordsInTopic) * 100 : 0,
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
            // Re-populate sau khi save để đảm bảo có đầy đủ thông tin topicId (tên, ảnh...)
            await progress.populate("topicProgress.topicId");
        }

        // Đảm bảo trả về dữ liệu đã được ép kiểu số đúng chuẩn
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

/**
 * Helper để cập nhật streak dựa trên ngày hoạt động cuối cùng
 */
const _updateStreak = (progress) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActivityDate = progress.stats.lastActivity ? new Date(progress.stats.lastActivity) : null;
    if (lastActivityDate) {
        lastActivityDate.setHours(0, 0, 0, 0);
    }

    if (!lastActivityDate) {
        // Lần đầu tiên hoạt động
        progress.stats.streakDays = 1;
    } else if (today.getTime() > lastActivityDate.getTime()) {
        const diffTime = today.getTime() - lastActivityDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            progress.stats.streakDays += 1;
        } else if (diffDays > 1) {
            progress.stats.streakDays = 1;
        }
    } else if (progress.stats.streakDays === 0) {
        progress.stats.streakDays = 1;
    }

    if (progress.stats.streakDays > progress.stats.maxStreak) {
        progress.stats.maxStreak = progress.stats.streakDays;
    }

    progress.stats.lastActivity = Date.now();
    return progress;
};

exports.updateLearningTime = async (req, res) => {
    try {
        const userId = req.user._id;
        let { durationMinutes, duration } = req.body;

        if (duration && duration > 0) {
            durationMinutes = duration / 60.0;
        }

        if (!durationMinutes || durationMinutes <= 0) {
            return res.status(400).json({ success: false, message: "Thời lượng không hợp lệ" });
        }

        durationMinutes = Math.round(durationMinutes * 100) / 100;

        let progress = await Progress.findOne({ userId });
        if (!progress) {
            progress = new Progress({ userId });
        }

        // Cập nhật thời gian và lịch sử
        progress.stats.totalLearningMinutes += durationMinutes;
        progress.accessHistory.push({
            sessionStart: new Date(Date.now() - durationMinutes * 60000),
            sessionEnd: new Date(),
            duration: durationMinutes,
            activity: "learning_session"
        });

        // Cập nhật streak dựa trên phiên làm việc
        progress = _updateStreak(progress);

        await progress.save();

        res.status(200).json({
            success: true,
            message: "Đã cập nhật thời gian học và streak",
            data: {
                totalLearningMinutes: progress.stats.totalLearningMinutes,
                streakDays: progress.stats.streakDays
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


