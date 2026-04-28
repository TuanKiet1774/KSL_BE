const LearnedWord = require("../models/LearnedWord");
const User = require("../models/User");
const Progress = require("../models/Progress");
const Word = require("../models/Word");
const mongoose = require("mongoose");

async function recalculateProgress(userId, topicId) {
    try {
        const uId = new mongoose.Types.ObjectId(userId);
        const tIdObj = new mongoose.Types.ObjectId(topicId);

        const learnedWordsCount = await LearnedWord.countDocuments({ userId: uId, topicId: tIdObj });
        const totalWordsInTopic = await mongoose.model("Word").countDocuments({ topicId: tIdObj });
        
        const percentage = totalWordsInTopic > 0 ? (learnedWordsCount / totalWordsInTopic) * 100 : 0;
        const totalWordsLearned = await LearnedWord.countDocuments({ userId: uId });
        
        const user = await User.findById(uId);
        const totalExp = user ? user.exp : 0;

        const progress = await Progress.findOneAndUpdate(
            { userId: uId },
            { $set: { "stats.totalWordsLearned": totalWordsLearned, "stats.totalExp": totalExp } },
            { upsert: true, returnDocument: 'after' }
        );

        const topicIndex = progress.topicProgress.findIndex(
            tp => tp.topicId && tp.topicId.toString() === topicId.toString()
        );

        if (topicIndex > -1) {
            if (learnedWordsCount > 0) {
                progress.topicProgress[topicIndex].learnedWordsCount = learnedWordsCount;
                progress.topicProgress[topicIndex].percentage = percentage;
                progress.topicProgress[topicIndex].lastUpdated = Date.now();
            } else {
                progress.topicProgress.splice(topicIndex, 1);
            }
        } else if (learnedWordsCount > 0) {
            progress.topicProgress.push({ 
                topicId: tIdObj, 
                learnedWordsCount, 
                percentage, 
                lastUpdated: Date.now() 
            });
        }

        await progress.save();
    } catch (err) {
        console.error("Error recalculating progress:", err);
    }
}

exports.getMyLearnedWords = async (req, res) => {
    try {
        const userId = req.user._id;
        const { topicId, sortBy, sortOrder, page = 1, limit = 10 } = req.query;

        const query = { userId };
        if (topicId) {
            query.topicId = topicId;
        }

        const skip = (page - 1) * limit;

        const learnedWords = await LearnedWord.find(query)
            .populate("wordId")
            .populate("topicId", "name")
            .sort({ [sortBy || "learnedAt"]: sortOrder === "asc" ? 1 : -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await LearnedWord.countDocuments(query);

        res.status(200).json({
            success: true,
            count: learnedWords.length,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit),
            data: learnedWords
        });
    } catch (error) {
        res.status(500).json({
          success: false,
          message: "Lỗi máy chủ nội bộ",
          error: error.message,
        });
    }
};

exports.getLearnedStats = async (req, res) => {
    try {
        const userId = req.user._id;

        // Thống kê theo Topic
        const statsByTopic = await LearnedWord.aggregate([
            { $match: { userId: userId } },
            {
                $group: {
                    _id: "$topicId",
                    learnedCount: { $sum: 1 },
                    totalExp: { $sum: "$expGained" }
                }
            },
            {
                $lookup: {
                    from: "topics",
                    localField: "_id",
                    foreignField: "_id",
                    as: "topicInfo"
                }
            },
            { $unwind: "$topicInfo" },
            {
                $project: {
                    topicId: "$_id",
                    _id: 0,
                    topicName: "$topicInfo.name",
                    learnedCount: 1,
                    totalExp: 1,
                    totalWordsInTopic: "$topicInfo.totalWord"
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: statsByTopic
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi máy chủ nội bộ",
            error: error.message
        });
    }
};

exports.learnWord = async (req, res) => {
    try {
        const userId = req.user._id;
        const { wordId, topicId, expGained } = req.body;

        if (!wordId || !topicId) {
            return res.status(400).json({
                success: false,
                message: "Thiếu wordId hoặc topicId"
            });
        }

        // Kiểm tra xem đã học chưa (để tránh tạo trùng lặp vì có unique index)
        const existing = await LearnedWord.findOne({ userId, wordId });
        if (existing) {
            return res.status(200).json({
                success: true,
                message: "Từ này đã được học trước đó",
                data: existing
            });
        }

        // Cộng dồn EXP cho người dùng trước khi tạo bản ghi để hook nhận được EXP mới nhất
        if (expGained && expGained > 0) {
            await User.findByIdAndUpdate(userId, {
                $inc: { exp: expGained }
            });
        }

        const learnedWord = await LearnedWord.create({
            userId,
            wordId,
            topicId,
            expGained: expGained || 0
        });

        res.status(201).json({
            success: true,
            message: "Đã đánh dấu từ vựng là đã học và nhận được EXP",
            data: learnedWord
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi máy chủ nội bộ",
            error: error.message
        });
    }
};

exports.deleteLearnedWord = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        const learnedWord = await LearnedWord.findOneAndDelete({ _id: id, userId });

        if (!learnedWord) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy từ vựng đã học hoặc bạn không có quyền xóa"
            });
        }

        // Trừ EXP khi xóa từ đã học
        if (learnedWord.expGained > 0) {
            await User.findByIdAndUpdate(userId, {
                $inc: { exp: -learnedWord.expGained }
            });
        }

        // Cập nhật lại Progress sau khi xóa
        await recalculateProgress(userId, learnedWord.topicId);

        res.status(200).json({
            success: true,
            message: "Đã xóa từ vựng khỏi danh sách đã học"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi máy chủ nội bộ",
            error: error.message
        });
    }
};

exports.deleteBulkLearnedWords = async (req, res) => {
    try {
        const userId = req.user._id;
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Danh sách ID không hợp lệ"
            });
        }

        // Tìm các từ sắp xóa để tính tổng EXP cần trừ
        const wordsToDelete = await LearnedWord.find({
            _id: { $in: ids },
            userId: userId
        });

        const totalExpToSubtract = wordsToDelete.reduce((sum, word) => sum + (word.expGained || 0), 0);

        // Lấy danh sách topic bị ảnh hưởng (duy nhất)
        const affectedTopicIds = [...new Set(wordsToDelete.map(w => w.topicId.toString()))];

        const result = await LearnedWord.deleteMany({
            _id: { $in: ids },
            userId: userId
        });

        // Trừ tổng EXP cho người dùng
        if (totalExpToSubtract > 0) {
            await User.findByIdAndUpdate(userId, {
                $inc: { exp: -totalExpToSubtract }
            });
        }

        // Cập nhật lại Progress cho tất cả topic bị ảnh hưởng
        for (const topicId of affectedTopicIds) {
            await recalculateProgress(userId, topicId);
        }

        res.status(200).json({
            success: true,
            message: `Đã xóa ${result.deletedCount} từ vựng đã học`,
            count: result.deletedCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi máy chủ nội bộ",
            error: error.message
        });
    }
};

exports.syncExp = async (req, res) => {
    try {
        const userId = req.user._id;

        // Tính tổng EXP từ tất cả từ đã học
        const learnedWords = await LearnedWord.find({ userId });
        const totalExp = learnedWords.reduce((sum, word) => sum + (word.expGained || 0), 0);

        // Cập nhật vào User
        await User.findByIdAndUpdate(userId, { exp: totalExp });

        res.status(200).json({
            success: true,
            message: "Đã đồng bộ điểm EXP thành công",
            totalExp: totalExp
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi máy chủ nội bộ",
            error: error.message
        });
    }
};
