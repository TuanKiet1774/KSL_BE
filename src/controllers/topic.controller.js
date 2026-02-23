const Topic = require("../models/Topic");
const paginate = require("../utils/pagination");

exports.getTopics = async (req, res) => {
    try {
        const {
            name,
            slug,
            description,
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
        if (name) {
            query.name = { $regex: name, $options: "i" };
        }
        if (slug) {
            query.slug = { $regex: slug, $options: "i" };
        }
        if (description) {
            query.description = { $regex: description, $options: "i" };
        }

        const result = await paginate(Topic, query, {
            page,
            limit,
            sortBy,
            sortOrder,
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

exports.createTopic = async (req, res) => {
    try {
        const topic = await Topic.create(req.body);
        res.status(201).json({
            success: true,
            data: topic,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getTopicById = async (req, res) => {
    try {
        const topic = await Topic.findById(req.params.id);
        if (!topic) {
            return res.status(404).json({ success: false, message: "Topic not found" });
        }
        res.status(200).json({ success: true, data: topic });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateTopic = async (req, res) => {
    try {
        const topic = await Topic.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!topic) {
            return res.status(404).json({ success: false, message: "Topic not found" });
        }

        res.status(200).json({ success: true, data: topic });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteTopic = async (req, res) => {
    try {
        const topic = await Topic.findByIdAndDelete(req.params.id);
        if (!topic) {
            return res.status(404).json({ success: false, message: "Topic not found" });
        }
        res.status(200).json({ success: true, message: "Topic deleted successfully" });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
