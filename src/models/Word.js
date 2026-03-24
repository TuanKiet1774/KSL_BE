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

    slug: {
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
        default: 5, // Mặc định mỗi từ mới cho 5 exp
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
    { name: "text", slug: "text", description: "text" },
    {
        weights: { name: 10, slug: 5, description: 1 },
        name: "WordTextIndex"
    }
);

// Middleware to track if it's a new document
wordSchema.pre("save", async function () {
    this.wasNew = this.isNew;
});

wordSchema.post("save", async function (doc) {
    if (this.wasNew) {
        await updateStastic("wordCount", 1);
    }
});

wordSchema.post("findOneAndDelete", async function (doc) {
    if (doc) {
        await updateStastic("wordCount", -1);
    }
});

module.exports = mongoose.model("Word", wordSchema);
