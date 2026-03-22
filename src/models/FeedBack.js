const mongoose = require("mongoose");
const { updateStastic } = require("../utils/stasticManager");

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

// Middleware to track if it's a new document
feedBackSchema.pre("save", function (next) {
  this.wasNew = this.isNew;
  next();
});

feedBackSchema.post("save", async function (doc, next) {
  if (this.wasNew) {
    await updateStastic("feedbackCount", 1);
  }
  next();
});

feedBackSchema.post("findOneAndDelete", async function (doc, next) {
  if (doc) {
    await updateStastic("feedbackCount", -1);
  }
  next();
});

module.exports = mongoose.model("FeedBack", feedBackSchema);
