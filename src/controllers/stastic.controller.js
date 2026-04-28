const User = require("../models/User");
const Topic = require("../models/Topic");
const Word = require("../models/Word");
const FeedBack = require("../models/FeedBack");
const Question = require("../models/Question");
const Stastic = require("../models/Stastic");

exports.getStastics = async (req, res) => {
  try {
    const [userCount, topicCount, wordCount, feedbackCount, questionCount] = await Promise.all([
      User.countDocuments(),
      Topic.countDocuments(),
      Word.countDocuments(),
      FeedBack.countDocuments(),
      Question.countDocuments(),
    ]);
    
    let stastic = await Stastic.findOne();
    if (!stastic) {
      stastic = new Stastic({
        userCount,
        topicCount,
        wordCount,
        feedbackCount,
        questionCount,
      });
    } else {
      stastic.userCount = userCount;
      stastic.topicCount = topicCount;
      stastic.wordCount = wordCount;
      stastic.feedbackCount = feedbackCount;
      stastic.questionCount = questionCount;
    }
    await stastic.save();

    res.status(200).json({
      success: true,
      data: {
        userCount,
        topicCount,
        wordCount,
        feedbackCount,
        questionCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ nội bộ",
      error: error.message,
    });
  }
};
