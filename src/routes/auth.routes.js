const express = require("express");
const router = express.Router();
const {
    register,
    login,
    verifyOTP,
    resendOTP,
    getProfile,
    updateProfile,
    refreshToken,
} = require("../controllers/auth.controller");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

module.exports = router;
