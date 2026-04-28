const Word = require("../models/Word");
const Topic = require("../models/Topic");
const FavoriteWord = require("../models/FavoriteWord");
const LearnedWord = require("../models/LearnedWord");
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
        name: { $regex: search, $options: "i" },
      }).select("_id");
      const topicIdsFromSearch = matchedTopics.map((t) => t._id);

      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { topicId: { $in: topicIdsFromSearch } },
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

    // Bổ sung trạng thái isFavorite và isLearned nếu có user
    if (req.user) {
      const userId = req.user._id;
      const wordIds = result.data.map(w => w._id);

      const [favorites, learned] = await Promise.all([
        FavoriteWord.find({ userId, wordId: { $in: wordIds } }),
        LearnedWord.find({ userId, wordId: { $in: wordIds } })
      ]);

      const favoriteIds = new Set(favorites.map(f => String(f.wordId)));
      const learnedIds = new Set(learned.map(l => String(l.wordId)));

      const dataWithStatus = result.data.map(word => {
        const wordObj = word.toObject();
        const idStr = String(word._id);
        return {
          ...wordObj,
          isFavorite: favoriteIds.has(idStr),
          isLearned: learnedIds.has(idStr)
        };
      });

      return res.status(200).json({
        success: true,
        ...result,
        data: dataWithStatus
      });
    }

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ nội bộ",
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
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy từ vựng" });
    }

    const wordObj = word.toObject();
    
    // Bổ sung trạng thái nếu có user
    if (req.user) {
      const userId = req.user._id;
      const [isFavorite, isLearned] = await Promise.all([
        FavoriteWord.exists({ userId, wordId: word._id }),
        LearnedWord.exists({ userId, wordId: word._id })
      ]);
      wordObj.isFavorite = !!isFavorite;
      wordObj.isLearned = !!isLearned;
    }

    res.status(200).json({ success: true, data: wordObj });
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
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy từ vựng" });
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
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy từ vựng" });
    }
    res.status(200).json({ success: true, message: "Xoá từ vựng thành công" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
