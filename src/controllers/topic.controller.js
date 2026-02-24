const Topic = require("../models/Topic");
const Progress = require("../models/Progress");
const paginate = require("../utils/pagination");

exports.getTopics = async (req, res) => {
    try {
        const {
            name,
            slug,
            description,
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
        if (name) {
            query.name = { $regex: name, $options: "i" };
        }
        if (slug) {
            query.slug = { $regex: slug, $options: "i" };
        }
        if (description) {
            query.description = { $regex: description, $options: "i" };
        }
        if (level) {
            query.level = level;
        }

        const result = await paginate(Topic, query, {
            page,
            limit,
            sortBy: sortBy || "order",
            sortOrder: sortOrder || "asc",
        });

        const userExp = req.user ? req.user.exp : 0;

        // Lấy thông tin tiến độ của người dùng để kiểm tra các topic đã hoàn thành
        let completedTopicIds = [];
        if (req.user) {
            const progress = await Progress.findOne({ userId: req.user._id });
            if (progress) {
                completedTopicIds = progress.completedTopics.map(t => t.topicId.toString());
            }
        }

        const topicsWithLockStatus = result.data.map((topic, index) => {
            const topicObj = topic.toObject();

            // Một topic bị khóa nếu:
            // 1. EXP người dùng thấp hơn EXP yêu cầu
            const expLocked = userExp < (topic.expRequired || 0);

            // 2. (Tùy chọn) Nếu muốn bắt buộc hoàn thành topic trước đó:
            // Tìm topic có số thứ tự ngay trước topic này (giả định topics được trả về đã sort theo order)
            // Trong thực tế, nên check dựa trên toàn bộ DB, nhưng ở đây ta check đơn giản:
            // Nếu không phải topic đầu tiên (order > 0) và topic trước đó chưa hoàn thành.
            // Tuy nhiên, yêu cầu chính là "theo EXP" nên ta ưu tiên EXP.

            return {
                ...topicObj,
                isLocked: expLocked,
                isCompleted: completedTopicIds.includes(topic._id.toString())
            };
        });

        res.status(200).json({
            success: true,
            count: result.data.length,
            ...result,
            data: topicsWithLockStatus
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

        const userExp = req.user ? req.user.exp : 0;
        if (userExp < (topic.expRequired || 0)) {
            return res.status(403).json({
                success: false,
                message: "You need more EXP to unlock this topic",
                requiredExp: topic.expRequired,
                currentExp: userExp
            });
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
