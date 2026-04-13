const express = require("express");
const router = express.Router();
const {
    register,
    login,
    getProfile,
    updateProfile,
    refreshToken,
    changePassword,
} = require("../controllers/auth.controller");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.post("/change-password", protect, changePassword);

module.exports = router;

