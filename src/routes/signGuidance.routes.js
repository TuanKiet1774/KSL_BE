const express = require("express");
const router = express.Router();
const signGuidanceController = require("../controllers/signGuidance.controller");

router.post("/analyze", signGuidanceController.analyzeSign);

module.exports = router;
