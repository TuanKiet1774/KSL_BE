const mongoose = require("mongoose");

const feedBackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

feedBackSchema.index({ rating: 1 });
feedBackSchema.index({ createdAt: -1 });

module.exports = mongoose.model("FeedBack", feedBackSchema);
