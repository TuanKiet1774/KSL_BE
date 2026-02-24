const Question = require("../models/Question");
const paginate = require("../utils/pagination");

exports.getQuestions = async (req, res) => {
    try {
        const {
            question,
            slug,
            topicId,
            type,
            level,
            page,
            limit,
            sortBy,
            sortOrder,
            search,
        } = req.query;

        const query = {};

        if (search) {
            query.$text = { $search: search };
        }
        if (topicId) {
            query.topicId = topicId;
        }
        if (type) {
            query.type = type;
        }
        if (level) {
            query.level = level;
        }
        if (question) {
            query.question = { $regex: question, $options: "i" };
        }
        if (slug) {
            query.slug = { $regex: slug, $options: "i" };
        }

        const result = await paginate(Question, query, {
            page,
            limit,
            sortBy,
            sortOrder,
            populate: "topicId",
        });

        res.status(200).json({
            success: true,
            count: result.data.length,
            ...result,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

exports.createQuestion = async (req, res) => {
    try {
        const question = await Question.create(req.body);
        res.status(201).json({
            success: true,
            data: question,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getQuestionById = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id).populate("topicId");
        if (!question) {
            return res.status(404).json({ success: false, message: "Question not found" });
        }
        res.status(200).json({ success: true, data: question });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateQuestion = async (req, res) => {
    try {
        const question = await Question.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!question) {
            return res.status(404).json({ success: false, message: "Question not found" });
        }

        res.status(200).json({ success: true, data: question });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteQuestion = async (req, res) => {
    try {
        const question = await Question.findByIdAndDelete(req.params.id);
        if (!question) {
            return res.status(404).json({ success: false, message: "Question not found" });
        }
        res.status(200).json({ success: true, message: "Question deleted successfully" });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
