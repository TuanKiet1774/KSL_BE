const Lesson = require("../models/Lesson");
const paginate = require("../utils/pagination");

exports.getLessons = async (req, res) => {
    try {
        const {
            name,
            slug,
            description,
            topicId,
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
        if (name) {
            query.name = { $regex: name, $options: "i" };
        }
        if (slug) {
            query.slug = { $regex: slug, $options: "i" };
        }
        if (description) {
            query.description = { $regex: description, $options: "i" };
        }

        const result = await paginate(Lesson, query, {
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

exports.createLesson = async (req, res) => {
    try {
        const lesson = await Lesson.create(req.body);
        res.status(201).json({
            success: true,
            data: lesson,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getLessonById = async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id).populate("topicId");
        if (!lesson) {
            return res.status(404).json({ success: false, message: "Lesson not found" });
        }
        res.status(200).json({ success: true, data: lesson });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateLesson = async (req, res) => {
    try {
        const lesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!lesson) {
            return res.status(404).json({ success: false, message: "Lesson not found" });
        }

        res.status(200).json({ success: true, data: lesson });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteLesson = async (req, res) => {
    try {
        const lesson = await Lesson.findByIdAndDelete(req.params.id);
        if (!lesson) {
            return res.status(404).json({ success: false, message: "Lesson not found" });
        }
        res.status(200).json({ success: true, message: "Lesson deleted successfully" });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
