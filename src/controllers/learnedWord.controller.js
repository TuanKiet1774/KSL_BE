const LearnedWord = require("../models/LearnedWord");

exports.getMyLearnedWords = async (req, res) => {
    try {
        const userId = req.user._id;
        const { topicId, sortBy, sortOrder } = req.query;

        const query = { userId };
        if (topicId) {
            query.topicId = topicId;
        }

        const learnedWords = await LearnedWord.find(query)
            .populate("wordId")
            .populate("topicId", "name")
            .sort({ [sortBy || "learnedAt"]: sortOrder === "asc" ? 1 : -1 });

        res.status(200).json({
            success: true,
            count: learnedWords.length,
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
