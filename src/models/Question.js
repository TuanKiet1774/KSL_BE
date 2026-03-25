const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 500,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "multiple-choice", //Nhiều đáp án => chọn 1
        "short-answer", //Gõ câu trả lời
        "recognition", //Trả lời bằng camera nhận diện
      ],
      default: "multiple-choice",
      index: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy",
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
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
    options: {
      type: [
        {
          content: { type: String, default: "" },
          media: {
            url: { type: String, default: "" },
            type: {
              type: String,
              enum: ["image", "gif", "video", "none"],
              default: "none",
            },
          },
          isCorrect: { type: Boolean, required: true, default: false },
        },
      ],
      validate: {
        validator: function (v) {
          if (!v || v.length === 0) {
            return false;
          }
          const minOptions = this.type === "multiple-choice" ? 2 : 1;
          const hasMinOptions = v && v.length >= minOptions;
          const correctAnswers = v
            ? v.filter((opt) => opt.isCorrect === true)
            : [];
          const hasExactlyOneCorrectAnswer = correctAnswers.length === 1;
          return hasMinOptions && hasExactlyOneCorrectAnswer;
        },
        message: (props) => {
          const type = props.instance ? props.instance.type : "default";
          const minOptions = type === "multiple-choice" ? 2 : 1;
          return `A ${type} question must have at least ${minOptions} options and exactly one correct answer.`;
        },
      },
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
      index: true,
    },
    score: {
      type: Number,
      default: 1,
    },
    time: {
      type: Number, // In seconds
      default: 0,
    }
  },
  { timestamps: true },
);

questionSchema.index({
  topicId: 1,
  difficulty: 1,
  type: 1,
  createdAt: -1,
});
questionSchema.index(
  { question: "text", description: "text" },
  {
    weights: { question: 10, description: 1 },
    name: "QuestionTextIndex",
  },
);
questionSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Question", questionSchema);
