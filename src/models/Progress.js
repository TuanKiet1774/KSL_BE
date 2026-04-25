const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    
    topicProgress: [{
        topicId: { type: mongoose.Schema.Types.ObjectId, ref: "Topic" },
        learnedWordsCount: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 }, 
        lastUpdated: { type: Date, default: Date.now }
    }],

    averageTestScore: { type: Number, default: 0 },

    accessHistory: [{
        sessionStart: { type: Date, required: true },
        sessionEnd:   { type: Date, default: null },
        duration:     { type: Number, default: 0 }, 
        activity:     { type: String, default: "app_session" } 
    }],

    stats: {
        totalExp: { type: Number, default: 0 },
        streakDays: { type: Number, default: 0 },
        lastActivity: { type: Date, default: Date.now }
    }
}, { timestamps: true });


progressSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model("Progress", progressSchema);
