const express = require("express");
const app = express();
const userRoutes = require("./routes/user.routes");
const topicRoutes = require("./routes/topic.routes");
const lessonRoutes = require("./routes/lesson.routes");
const questionRoutes = require("./routes/question.routes");
const wordRoutes = require("./routes/word.routes");
const progressRoutes = require("./routes/progress.routes");
const examRoutes = require("./routes/exam.routes");

app.use(express.json());
app.use("/api/users", userRoutes);
app.use("/api/topics", topicRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/words", wordRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/exams", examRoutes);

app.get("/", (req, res) => {
    res.send("API is running...");
});

module.exports = app;
