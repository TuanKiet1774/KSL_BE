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
    forgotPassword,
    resetPassword,
    requestChangePassword,
    changePassword,
} = require("../controllers/auth.controller");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/request-change-password", protect, requestChangePassword);
router.post("/change-password", protect, changePassword);

module.exports = router;
