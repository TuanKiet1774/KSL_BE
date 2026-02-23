const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 500,
        index: true,
    },
    slug: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 100,
        index: true,
        unique: true,
    },
    type: {
        type: String,
        required: true,
        enum: [
            "multiple-choice",
            "sign-to-text",
            "text-to-sign",
            "image-to-sign",
            "video-recognition",
            "practice"
        ],
        default: "multiple-choice",
        index: true,
    },
    level: {
        type: String,
        enum: ["Beginner", "Intermediate", "Advanced"],
        default: "Beginner",
        index: true,
    },
    points: { 
        type: Number,
        default: 10,
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
                isCorrect: { type: Boolean, required: true, default: false }
            }
        ],
        validate: {
            validator: function (v) {
                if (["video-recognition", "practice"].includes(this.type)) {
                    return true;
                }
                const hasMinOptions = v && v.length >= 2;
                const correctAnswers = v ? v.filter(opt => opt.isCorrect === true) : [];
                const hasExactlyOneCorrectAnswer = correctAnswers.length === 1;
                return hasMinOptions && hasExactlyOneCorrectAnswer;
            },
            message: "A question must have at least 2 options and exactly one correct answer."
        }
    },
    lessonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lesson",
        required: true,
        index: true,
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    }
}, { timestamps: true });

questionSchema.index({ lessonId: 1, isActive: 1, difficulty: 1, type: 1, createdAt: -1 });
questionSchema.index(
    { question: "text", slug: "text", description: "text" },
    {
        weights: { question: 10, slug: 5, description: 1 },
        name: "QuestionTextIndex"
    }
);
questionSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Question", questionSchema);