const mongoose = require("mongoose");

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
}, { timestamps: true });

topicSchema.index(
    { name: "text", slug: "text", description: "text" },
    {
        weights: { name: 10, slug: 5, description: 1 },
        name: "TopicTextIndex"
    }
);
topicSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Topic", topicSchema);