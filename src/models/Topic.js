const mongoose = require("mongoose");
const { updateStastic } = require("../utils/stasticManager");

const topicSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 100,
        index: true,
    },
    level: {
        type: String,
        enum: ["Beginner", "Intermediate", "Advanced"],
        default: "Beginner",
        index: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 1000,
        index: true,
    },
    image: {
        type: String,
        default: "",
    },
    expRequired: {
        type: Number,
        default: 0,
        index: true,
    },
    totalWord: {
        type: Number,
        default: 0,
    }
}, { timestamps: true });

topicSchema.index(
    { name: "text", description: "text" },
    {
        weights: { name: 10, description: 1 },
        name: "TopicTextIndex"
    }
);
topicSchema.index({ createdAt: -1 });

// Middleware to track if it's a new document
topicSchema.pre("save", async function () {
    this.wasNew = this.isNew;
});

topicSchema.post("save", async function (doc) {
    if (this.wasNew) {
        await updateStastic("topicCount", 1);
    }
});

topicSchema.post("findOneAndDelete", async function (doc) {
    if (doc) {
        await updateStastic("topicCount", -1);
        
        const topicId = doc._id;
        
        try {
            // 1. Xóa tất cả từ vựng thuộc chủ đề này
            const words = await mongoose.model("Word").find({ topicId });
            const wordIds = words.map(w => w._id);
            if (wordIds.length > 0) {
                await mongoose.model("Word").deleteMany({ topicId });
                // Cập nhật thống kê số lượng từ
                await updateStastic("wordCount", -wordIds.length);
            }
            
            // 2. Xóa tất cả câu hỏi thuộc chủ đề này
            await mongoose.model("Question").deleteMany({ topicId });
            
            // 3. Cập nhật Progress: Xóa topic khỏi danh sách hoàn thành của người dùng
            await mongoose.model("Progress").updateMany(
                { "completedTopics.topicId": topicId },
                { $pull: { completedTopics: { topicId: topicId } } }
            );
            
            // 4. Cập nhật Progress: Xóa các từ vựng đã học thuộc chủ đề này
            if (wordIds.length > 0) {
                await mongoose.model("Progress").updateMany(
                    { "learnedWords.wordId": { $in: wordIds } },
                    { $pull: { learnedWords: { wordId: { $in: wordIds } } } }
                );
            }
            
            console.log(`Cascade delete completed for topic: ${doc.name}`);
        } catch (err) {
            console.error("Error in topic cascade delete:", err);
        }
    }
});

module.exports = mongoose.model("Topic", topicSchema);