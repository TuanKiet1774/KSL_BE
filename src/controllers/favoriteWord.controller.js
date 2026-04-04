const FavoriteWord = require("../models/FavoriteWord");
const Word = require("../models/Word");

/**
 * @desc    Thêm từ vựng vào danh sách yêu thích/cần lưu ý
 * @route   POST /api/favorite-words
 * @access  Private
 */
exports.addToFavorite = async (req, res) => {
    try {
        const { wordId, note, category } = req.body;
        const userId = req.user._id;

        // Kiểm tra xem từ vựng có tồn tại không
        const word = await Word.findById(wordId);
        if (!word) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy từ vựng này"
            });
        }

        // Kiểm tra xem đã lưu từ này chưa
        const existingFavorite = await FavoriteWord.findOne({ userId, wordId });
        if (existingFavorite) {
            return res.status(400).json({
                success: false,
                message: "Từ này đã có trong danh sách của bạn"
            });
        }

        const favorite = await FavoriteWord.create({
            userId,
            wordId,
            note,
            category
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

/**
 * @desc    Lấy danh sách từ vựng yêu thích của người dùng hiện tại
 * @route   GET /api/favorite-words
 * @access  Private
 */
exports.getMyFavorites = async (req, res) => {
    try {
        const userId = req.user._id;
        const { category } = req.query;

        const query = { userId };
        if (category) {
            query.category = category;
        }

        // Populate thông tin chi tiết của từ vựng
        const favorites = await FavoriteWord.find(query)
            .populate("wordId")
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

/**
 * @desc    Cập nhật thông tin (ghi chú, phân loại) cho từ đã lưu
 * @route   PUT /api/favorite-words/:id
 * @access  Private
 */
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
        );

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

/**
 * @desc    Xóa từ khỏi danh sách yêu thích
 * @route   DELETE /api/favorite-words/:id
 * @access  Private
 */
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
