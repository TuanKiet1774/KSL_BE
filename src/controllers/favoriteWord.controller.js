const mongoose = require("mongoose");
const FavoriteWord = require("../models/FavoriteWord");
const Word = require("../models/Word");

exports.addToFavorite = async (req, res) => {
    try {
        const { wordId, note, category } = req.body;
        const userId = req.user._id;

        const word = await Word.findById(wordId);
        if (!word) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy từ vựng này"
            });
        }

        const existingFavorite = await FavoriteWord.findOne({ 
            userId: userId, 
            wordId: new mongoose.Types.ObjectId(wordId) 
        });
        if (existingFavorite) {
            return res.status(400).json({
                success: false,
                message: "Từ này đã có trong danh sách của bạn"
            });
        }

        let favorite = await FavoriteWord.create({
            userId: userId,
            wordId: new mongoose.Types.ObjectId(wordId),
            note,
            category
        });

        favorite = await FavoriteWord.findById(favorite._id).populate({
            path: "wordId",
            populate: { path: "topicId" }
        });

        res.status(201).json({
            success: true,
            data: favorite
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

exports.getMyFavorites = async (req, res) => {
    try {
        const userId = req.user._id;
        const { category } = req.query;

        const query = { userId };
        if (category) {
            query.category = category;
        }

        const favorites = await FavoriteWord.find(query)
            .populate({
                path: "wordId",
                populate: { path: "topicId" }
            })
            .sort("-createdAt");

        res.status(200).json({
            success: true,
            count: favorites.length,
            data: favorites
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi Server",
            error: error.message
        });
    }
};

exports.updateFavorite = async (req, res) => {
    try {
        const { note, category } = req.body;
        
        let favorite = await FavoriteWord.findById(req.params.id);

        if (!favorite) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy nội dung yêu cầu"
            });
        }

        // Đảm bảo người dùng chỉ sửa được phần của mình
        if (favorite.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                success: false,
                message: "Không có quyền thực hiện hành động này"
            });
        }

        favorite = await FavoriteWord.findByIdAndUpdate(
            req.params.id, 
            { note, category }, 
            { new: true, runValidators: true }
        ).populate({
            path: "wordId",
            populate: { path: "topicId" }
        });

        res.status(200).json({
            success: true,
            data: favorite
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

exports.removeFromFavorite = async (req, res) => {
    try {
        const favorite = await FavoriteWord.findById(req.params.id);

        if (!favorite) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy nội dung yêu cầu"
            });
        }

        // Kiểm tra quyền sở hữu
        if (favorite.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                success: false,
                message: "Không có quyền thực hiện hành động này"
            });
        }

        await favorite.deleteOne();

        res.status(200).json({
            success: true,
            message: "Đã xóa khỏi danh sách yêu thích"
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

exports.removeFromFavoriteByWordId = async (req, res) => {
    try {
        const userId = req.user._id;
        const { wordId } = req.params;

        const result = await FavoriteWord.findOneAndDelete({ 
            userId: userId, 
            wordId: new mongoose.Types.ObjectId(wordId) 
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy từ vựng này trong danh sách yêu thích"
            });
        }

        res.status(200).json({
            success: true,
            message: "Đã xóa khỏi danh sách yêu thích"
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
