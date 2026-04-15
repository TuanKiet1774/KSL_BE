const mongoose = require("mongoose");
const Topic = require("../models/Topic");
const Progress = require("../models/Progress");
const paginate = require("../utils/pagination");

exports.getTopics = async (req, res) => {
    try {
        const {
            name,
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
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } }
            ];
        }
        if (name) {
            query.name = { $regex: name, $options: "i" };
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
            sortBy: sortBy || "createdAt",
            sortOrder: sortOrder || "desc",
        });

        const userExp = req.user ? req.user.exp : 0;
        let completedTopicIds = [];
        if (req.user) {
            const progress = await Progress.findOne({ userId: req.user._id });
            if (progress) {
                completedTopicIds = progress.completedTopics.map(t => t.topicId.toString());
            }
        }

        const topicsWithLockStatus = await Promise.all(result.data.map(async (topic) => {
            const topicObj = topic.toObject();
            const expLocked = userExp < (topic.expRequired || 0);
            if (!topic.totalWord || topic.totalWord === 0) {
                const actualCount = await mongoose.model("Word").countDocuments({ topicId: topic._id });
                if (actualCount > 0) {
                    topicObj.totalWord = actualCount;
                    await Topic.findByIdAndUpdate(topic._id, { totalWord: actualCount });
                }
            }

            return {
                ...topicObj,
                isLocked: expLocked,
                isCompleted: completedTopicIds.includes(topic._id.toString())
            };
        }));

        res.status(200).json({
            success: true,
            count: result.data.length,
            ...result,
            data: topicsWithLockStatus
        });
    } catch (error) {
        res.status(500).json({
          success: false,
          message: "Lỗi máy chủ nội bộ",
          error: error.message,
        });
    }
};

exports.createTopic = async (req, res) => {
    try {
        const data = { ...req.body };
        delete data.totalWord;
        const topic = await Topic.create(data);
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
            return res.status(404).json({ success: false, message: "Không tìm thấy chủ đề" });
        }

        const userExp = req.user ? req.user.exp : 0;
        if (userExp < (topic.expRequired || 0)) {
            return res.status(403).json({
                success: false,
                message: "Bạn cần thêm EXP để mở khóa chủ đề này",
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
        const data = { ...req.body };
        delete data.totalWord;
        const topic = await Topic.findByIdAndUpdate(req.params.id, data, {
            new: true,
            runValidators: true,
        });

        if (!topic) {
            return res.status(404).json({ success: false, message: "Không tìm thấy chủ đề" });
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
            return res.status(404).json({ success: false, message: "Không tìm thấy chủ đề" });
        }
        res.status(200).json({ success: true, message: "Xoá chủ đề thành công" });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
