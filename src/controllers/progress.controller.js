const Progress = require("../models/Progress");
const Word = require("../models/Word");
const User = require("../models/User");
const LearnedWord = require("../models/LearnedWord");

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

        // Tạo bản ghi LearnedWord — hook post("save") sẽ tự cập nhật topicProgress
        await LearnedWord.create({
            userId,
            wordId,
            topicId: word.topicId,
            expGained: expGain,
            learnedAt: Date.now()
        });

        await User.findByIdAndUpdate(userId, { $inc: { exp: expGain } });

        // Cập nhật totalExp trong Progress stats
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

