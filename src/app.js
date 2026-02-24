const express = require("express");
const app = express();
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const userRoutes = require("./routes/user.routes");
const topicRoutes = require("./routes/topic.routes");
const lessonRoutes = require("./routes/lesson.routes");
const questionRoutes = require("./routes/question.routes");
const wordRoutes = require("./routes/word.routes");
const progressRoutes = require("./routes/progress.routes");
const examRoutes = require("./routes/exam.routes");
const feedbackRoutes = require("./routes/feedback.routes");

app.use(helmet());

app.use(cors());

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

app.use(mongoSanitize());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: "Too many requests from this IP, please try again after 15 minutes"
});
app.use("/api", limiter);

app.use("/api/users", userRoutes);
app.use("/api/topics", topicRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/words", wordRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/feedbacks", feedbackRoutes);

app.get("/", (req, res) => {
    res.send("API is running...");
});

module.exports = app;
