const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema({
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
    topicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Topic",
        required: true,
        index: true,
    },
}, { timestamps: true });

lessonSchema.index({ topicId: 1, createdAt: -1 });
lessonSchema.index(
    { name: "text", slug: "text", description: "text" },
    {
        weights: { name: 10, slug: 5, description: 1 },
        name: "LessonTextIndex"
    }
);

module.exports = mongoose.model("Lesson", lessonSchema);
