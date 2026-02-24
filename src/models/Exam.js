const mongoose = require("mongoose");

const examSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
        default: "",
    },
    topicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Topic",
        index: true,
    },
    questions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
        required: true
    }],
    duration: {
        type: Number, // In seconds
        default: 1800, // 30 minutes
    },
    maxScore: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    }
}, { timestamps: true });

examSchema.index({ topicId: 1, createdAt: -1 });

module.exports = mongoose.model("Exam", examSchema);
