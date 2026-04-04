const Progress = require("../models/Progress");
const Word = require("../models/Word");
const User = require("../models/User");
const LearnedWord = require("../models/LearnedWord");

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
        const userId = req.user._id; 
        const { wordId } = req.body;

        // 1. Kiểm tra từ vựng tồn tại
        const word = await Word.findById(wordId);
        if (!word) {
            return res.status(404).json({ success: false, message: "Từ vựng không tồn tại" });
        }

        // 2. Kiểm tra xem đã học chưa từ chính LearnedWord model
        const existingRecord = await LearnedWord.findOne({ userId, wordId });
        if (existingRecord) {
            return res.status(400).json({
                success: false,
                message: "Bạn đã học từ này rồi"
            });
        }

        const expGain = word.exp || 5;

        // 3. Tạo bản ghi chi tiết
        await LearnedWord.create({
            userId,
            wordId,
            topicId: word.topicId,
            expGained: expGain,
            learnedAt: Date.now()
        });

        // 4. Cộng EXP vào User Profile
        await User.findByIdAndUpdate(userId, {
            $inc: { exp: expGain }
        });

        // 5. Cập nhật Progress summary
        const progress = await Progress.findOneAndUpdate(
            { userId },
            {
                $addToSet: { learnedWords: { wordId, learnedAt: Date.now() } },
                $inc: { "stats.totalExp": expGain },
                $set: { "stats.lastActivity": Date.now() }
            },
            { new: true, upsert: true }
        );

        res.status(200).json({
            success: true,
            message: `Học thành công! +${expGain} EXP`,
            data: progress
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
