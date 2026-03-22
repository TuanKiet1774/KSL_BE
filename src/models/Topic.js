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
    slug: {
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
    expRequired: {
        type: Number,
        default: 0,
        index: true,
    }
}, { timestamps: true });

topicSchema.index(
    { name: "text", slug: "text", description: "text" },
    {
        weights: { name: 10, slug: 5, description: 1 },
        name: "TopicTextIndex"
    }
);
topicSchema.index({ createdAt: -1 });

// Middleware to track if it's a new document
topicSchema.pre("save", function (next) {
    this.wasNew = this.isNew;
    next();
});

topicSchema.post("save", async function (doc, next) {
    if (this.wasNew) {
        await updateStastic("topicCount", 1);
    }
    next();
});

topicSchema.post("findOneAndDelete", async function (doc, next) {
    if (doc) {
        await updateStastic("topicCount", -1);
    }
    next();
});

module.exports = mongoose.model("Topic", topicSchema);