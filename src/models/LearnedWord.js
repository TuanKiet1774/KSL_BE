const mongoose = require("mongoose");

const learnedWordSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    wordId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Word",
        required: true
    },
    topicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Topic",
        required: true,
        index: true
    },
    expGained: {
        type: Number,
        default: 0
    },
    learnedAt: {
        type: Date,
        default: Date.now
    },
    lastReviewed: {
        type: Date,
        default: Date.now
    }
}, { 
    timestamps: true 
});

learnedWordSchema.index({ userId: 1, wordId: 1 }, { unique: true });

module.exports = mongoose.model("LearnedWord", learnedWordSchema);
