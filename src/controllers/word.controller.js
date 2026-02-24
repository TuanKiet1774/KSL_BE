const Word = require("../models/Word");
const paginate = require("../utils/pagination");

exports.getWords = async (req, res) => {
    try {
        const {
            name,
            slug,
            description,
            topicId,
            level,
            isActive,
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
        if (level) {
            query.level = level;
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
        if (isActive !== undefined) {
            query.isActive = isActive === "true";
        }

        const result = await paginate(Word, query, {
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

exports.createWord = async (req, res) => {
    try {
        const word = await Word.create(req.body);
        res.status(201).json({
            success: true,
            data: word,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getWordById = async (req, res) => {
    try {
        const word = await Word.findById(req.params.id).populate("topicId");
        if (!word) {
            return res.status(404).json({ success: false, message: "Word not found" });
        }
        res.status(200).json({ success: true, data: word });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateWord = async (req, res) => {
    try {
        const word = await Word.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!word) {
            return res.status(404).json({ success: false, message: "Word not found" });
        }

        res.status(200).json({ success: true, data: word });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteWord = async (req, res) => {
    try {
        const word = await Word.findByIdAndDelete(req.params.id);
        if (!word) {
            return res.status(404).json({ success: false, message: "Word not found" });
        }
        res.status(200).json({ success: true, message: "Word deleted successfully" });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
