const FeedBack = require("../models/FeedBack");

exports.createFeedBack = async (req, res) => {
    try {
        const { userId, rating, comment } = req.body;
        const feedback = await FeedBack.create({
            userId,
            rating,
            comment,
        });
        res.status(201).json({
            success: true,
            data: feedback,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getFeedBacks = async (req, res) => {
    try {
        const feedbacks = await FeedBack.find()
            .populate("userId", "fullname username avatar")
            .sort("-createdAt");
        res.status(200).json({
            success: true,
            count: feedbacks.length,
            data: feedbacks,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

exports.getFeedBackById = async (req, res) => {
    try {
        const feedback = await FeedBack.findById(req.params.id).populate("userId", "fullname username avatar");
        if (!feedback) {
            return res.status(404).json({ success: false, message: "Feedback not found" });
        }
        res.status(200).json({ success: true, data: feedback });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteFeedBack = async (req, res) => {
    try {
        const feedback = await FeedBack.findByIdAndDelete(req.params.id);
        if (!feedback) {
            return res.status(404).json({ success: false, message: "Feedback not found" });
        }
        res.status(200).json({ success: true, message: "Feedback deleted successfully" });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
