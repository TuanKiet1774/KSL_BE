const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    
    // Lưu tiến độ theo từng chủ đề: số từ đã học và % hoàn thành
    topicProgress: [{
        topicId: { type: mongoose.Schema.Types.ObjectId, ref: "Topic" },
        learnedWordsCount: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 }, // % trên tổng số từ của topic
        lastUpdated: { type: Date, default: Date.now }
    }],

    // Tính điểm trung bình cộng điểm của các bài kiểm tra
    averageTestScore: { type: Number, default: 0 },

    // Lưu lịch sử phiên sử dụng app để tính streakDays
    // Mỗi phiên ghi lại giờ bắt đầu, kết thúc và tổng thời gian (giây)
    accessHistory: [{
        sessionStart: { type: Date, required: true },
        sessionEnd:   { type: Date, default: null },
        duration:     { type: Number, default: 0 }, // Tổng số giây của phiên
        activity:     { type: String, default: "app_session" } // login_web | login_mobile | app_session
    }],

    // Thống kê chung (Giữ nguyên theo yêu cầu)
    stats: {
        totalExp: { type: Number, default: 0 },
        streakDays: { type: Number, default: 0 },
        lastActivity: { type: Date, default: Date.now }
    }
}, { timestamps: true });


progressSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model("Progress", progressSchema);
