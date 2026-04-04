const Word = require("../models/Word");
const Topic = require("../models/Topic");
const paginate = require("../utils/pagination");

exports.getWords = async (req, res) => {
    try {
        const {
            name,
            description,
            topicId,
            level,
            page,
            limit,
            sortBy,
            sortOrder,
            search,
        } = req.query;

        const query = {};

        if (search) {
            const matchedTopics = await Topic.find({
                name: { $regex: search, $options: "i" }
            }).select('_id');
            const topicIdsFromSearch = matchedTopics.map(t => t._id);

            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
                { topicId: { $in: topicIdsFromSearch } }
            ];
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
        if (description) {
            query.description = { $regex: description, $options: "i" };
        }

        const result = await paginate(Word, query, {
            page,
            limit,
            sortBy: sortBy || "createdAt",
            sortOrder: sortOrder || "desc",
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
