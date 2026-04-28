const mongoose = require("mongoose");
const { updateStastic } = require("../utils/stasticManager");

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
    media: {
      url: {
        type: String,
        default: "",
      },
      type: {
        type: String,
        enum: ["image", "gif", "video", "none"],
        default: "none",
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
              enum: ["image", "gif", "video" ,"none"],
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
          return `Loại ${type} câu hỏi này phải có ít nhất ${minOptions} đáp án và chỉ có một đáp án đúng.`;
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
      type: Number, 
      default: 30,
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
  { question: "text"},
  {
    weights: { question: 10},
    name: "QuestionTextIndex",
  },
);
questionSchema.index({ createdAt: -1 });

questionSchema.pre("save", async function () {
  this.wasNew = this.isNew;
});

questionSchema.post("save", async function (doc) {
  if (this.wasNew) {
    await updateStastic("questionCount", 1);
  }
});

questionSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await updateStastic("questionCount", -1);
  }
});

module.exports = mongoose.model("Question", questionSchema);
