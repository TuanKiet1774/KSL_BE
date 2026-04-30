const Exam = require("../models/Exam");
const ExamResult = require("../models/ExamResult");
const Progress = require("../models/Progress");
const User = require("../models/User");
const paginate = require("../utils/pagination");

exports.getExams = async (req, res) => {
  try {
    const { page, limit, sortBy, sortOrder, search } = req.query;

    const query = {};
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    const result = await paginate(Exam, query, {
      page,
      limit,
      sortBy: sortBy || "createdAt",
      sortOrder: sortOrder || "desc",
      populate: [],
    });

    res.status(200).json({
      success: true,
      count: result.data ? result.data.length : 0,
      ...result,
      data: result.data || []
    });
  } catch (error) {
    console.error("Error in getExams:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createExam = async (req, res) => {
  try {
    const exam = await Exam.create(req.body);
    res.status(201).json({
      success: true,
      data: exam,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate("questions");

    if (!exam) {
      return res
        .status(404)
        .json({ success: false, message: "Kỳ thi không tồn tại" });
    }

    res.status(200).json({
      success: true,
      data: exam,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateExam = async (req, res) => {
  try {
    const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!exam) {
      return res
        .status(404)
        .json({ success: false, message: "Kỳ thi không tồn tại" });
    }

    res.status(200).json({ success: true, data: exam });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) {
      return res
        .status(404)
        .json({ success: false, message: "Kỳ thi không tồn tại" });
    }
    res
      .status(200)
      .json({ success: true, message: "Kỳ thi đã được xóa thành công" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.submitExamResult = async (req, res) => {
  try {
    const { userId, examId, results, totalScore, maxScore, timeSpent } = req.body;

    await Exam.findById(examId);

    // Cộng dồn EXP cho người dùng trước khi tạo bản ghi để hook nhận được EXP mới nhất
    await User.findByIdAndUpdate(userId, { $inc: { exp: totalScore } });

    // Tạo ExamResult — hook post("save") sẽ tự tính lại averageTestScore và đồng bộ EXP trong Progress
    const examResult = await ExamResult.create({
      userId,
      examId,
      results,
      totalScore,
      maxScore,
      timeSpent,
      status: "completed",
    });

    res.status(201).json({ success: true, data: examResult });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};


exports.getUserResults = async (req, res) => {
  try {
    const results = await ExamResult.find({ userId: req.params.userId })
      .populate("examId", "title")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteExamResult = async (req, res) => {
  try {
    const result = await ExamResult.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ success: false, message: "Kết quả không tồn tại" });
    }
    res.status(200).json({ success: true, message: "Đã xóa kết quả bài thi" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.clearUserResults = async (req, res) => {
  try {
    await ExamResult.deleteMany({ userId: req.params.userId });
    res.status(200).json({ success: true, message: "Đã xóa toàn bộ lịch sử bài thi" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
