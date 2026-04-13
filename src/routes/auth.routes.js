const express = require("express");
const router = express.Router();
const {
    register,
    login,
    getProfile,
    updateProfile,
    refreshToken,
    changePassword,
    verifyPassword,
    verifyIdentity,
} = require("../controllers/auth.controller");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.post("/change-password", protect, changePassword);
router.post("/verify-password", protect, verifyPassword);
router.post("/verify-identity", protect, verifyIdentity);

module.exports = router;

