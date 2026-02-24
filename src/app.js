const express = require("express");
const app = express();
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const topicRoutes = require("./routes/topic.routes");
const questionRoutes = require("./routes/question.routes");
const wordRoutes = require("./routes/word.routes");
const progressRoutes = require("./routes/progress.routes");
const examRoutes = require("./routes/exam.routes");
const feedbackRoutes = require("./routes/feedback.routes");
const { protect } = require("./middleware/authMiddleware");

app.use(cors());
app.use(express.json());


app.use("/api/auth", authRoutes);
app.use("/api/users", protect, userRoutes);
app.use("/api/topics", protect, topicRoutes);
app.use("/api/questions", protect, questionRoutes);
app.use("/api/words", protect, wordRoutes);
app.use("/api/progress", protect, progressRoutes);
app.use("/api/exams", protect, examRoutes);
app.use("/api/feedbacks", protect, feedbackRoutes);

app.get("/", (req, res) => {
    res.send("API is running...");
});

module.exports = app;
