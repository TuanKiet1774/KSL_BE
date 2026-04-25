const mongoose = require("mongoose");
const { updateStastic } = require("../utils/stasticManager");

const wordSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 100,
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

    media: {
        url: {
            type: String,
            default: "",
        },
        type: {
            type: String,
            enum: ["image", "gif", "video"],
            default: "image",
        },
    },

    exp: {
        type: Number,
        default: 5,
    },

    topicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Topic",
        required: true,
        index: true,
    },

}, { timestamps: true });

wordSchema.index({ topicId: 1, createdAt: -1 });
wordSchema.index(
    { name: "text", description: "text" },
    {
        weights: { name: 10, description: 1 },
        name: "WordTextIndex"
    }
);

wordSchema.pre("save", async function () {
    this.wasNew = this.isNew;
});

wordSchema.post("save", async function (doc) {
    if (this.wasNew) {
        await updateStastic("wordCount", 1);
        try {
            await mongoose.model("Topic").findByIdAndUpdate(doc.topicId, { 
                $inc: { totalWord: 1 } 
            });
        } catch (err) {
            console.error("Lỗi khi cập nhật tổng số từ trong chủ đề:", err);
        }
    }
});

wordSchema.post("findOneAndDelete", async function (doc) {
    if (doc) {
        await updateStastic("wordCount", -1);
        try {
            await mongoose.model("Topic").findByIdAndUpdate(doc.topicId, { 
                $inc: { totalWord: -1 } 
            });
        } catch (err) {
            console.error("Lỗi khi xoá tổng số từ trong chủ đề:", err);
        }
    }
});

module.exports = mongoose.model("Word", wordSchema);
