const Progress = require("../models/Progress");
const Word = require("../models/Word");
const User = require("../models/User");

// Lấy tiến độ của người dùng hiện tại
exports.getProgress = async (req, res) => {
    try {
        let progress = await Progress.findOne({ userId: req.params.userId })
            .populate("completedTopics.topicId")
            .populate("learnedWords.wordId")
            .populate("completedExams.examId")
            .populate("completedExams.resultId");

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

exports.completeTopic = async (req, res) => {
    try {
        const { userId, topicId } = req.body;
        const progress = await Progress.findOneAndUpdate(
            { userId },
            { $addToSet: { completedTopics: { topicId, completedAt: Date.now() } } },
            { new: true, upsert: true }
        );
        res.status(200).json({ success: true, data: progress });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.learnWord = async (req, res) => {
    try {
        const { userId, wordId } = req.body;
        const existingProgress = await Progress.findOne({
            userId,
            "learnedWords.wordId": wordId
        });

        if (existingProgress) {
            return res.status(200).json({
                success: true,
                message: "Word already learned",
                data: existingProgress
            });
        }

        const word = await Word.findById(wordId);
        if (!word) {
            return res.status(404).json({ success: false, message: "Word not found" });
        }

        const expGain = word.exp || 5;

        await User.findByIdAndUpdate(userId, {
            $inc: { exp: expGain }
        });

        const progress = await Progress.findOneAndUpdate(
            { userId },
            {
                $addToSet: { learnedWords: { wordId, learnedAt: Date.now() } },
                $inc: { "stats.totalExp": expGain }
            },
            { new: true, upsert: true }
        );

        res.status(200).json({
            success: true,
            message: `Learned! +${expGain} EXP`,
            data: progress
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
