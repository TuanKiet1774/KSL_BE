const mongoose = require("mongoose");

const favoriteWordSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    wordId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Word",
        required: true,
        index: true
    },
    note: {
        type: String,
        default: "",
        trim: true,
        maxlength: 200,
    },
    category: {
        type: String,
        enum: ["favorite", "need_review", "hard"],
        default: "favorite"
    }
}, { 
    timestamps: true 
});

favoriteWordSchema.index({ userId: 1, wordId: 1 }, { unique: true });

module.exports = mongoose.model("FavoriteWord", favoriteWordSchema);
