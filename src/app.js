const express = require("express");
const app = express();
const userRoutes = require("./routes/user.routes");
const topicRoutes = require("./routes/topic.routes");

app.use(express.json());
app.use("/api/users", userRoutes);
app.use("/api/topics", topicRoutes);

app.get("/", (req, res) => {
    res.send("API is running...");
});

module.exports = app;
