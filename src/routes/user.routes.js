const express = require("express");
const router = express.Router();
const {
    getUsers,
    createUser,
    getUserById,
    updateUser,
    deleteUser,
    register,
    login
} = require("../controllers/user.controller");

const { protect, authorize } = require("../middleware/authMiddleware");

// Public routes
router.post("/register", register);
router.post("/login", login);

// Admin only routes (Example: only admin can get all users or create new ones)
router.route("/")
    .get(protect, authorize("admin"), getUsers)
    .post(protect, authorize("admin"), createUser);

// Admin or Self routes
router.route("/:id")
    .get(protect, getUserById)
    .put(protect, updateUser)
    .delete(protect, authorize("admin"), deleteUser);

module.exports = router;
