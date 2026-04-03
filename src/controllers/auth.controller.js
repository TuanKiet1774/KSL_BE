const User = require("../models/User");
const jwt = require("jsonwebtoken");

const generateAccessToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || "15m",
    });
};

const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || "refresh_secret_ksl_2026", {
        expiresIn: "7d",
    });
};

exports.register = async (req, res) => {
    try {
        const { username, fullname, email, password, phone, birthday, address, gender } = req.body;
        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: "User with this email or username already exists",
            });
        }
        const user = await User.create({
            username,
            fullname,
            email,
            password,
            phone,
            birthday,
            address,
            gender
        });

        if (user) {
            res.status(201).json({
                success: true,
                data: {
                    _id: user._id,
                    username: user.username,
                    fullname: user.fullname,
                    email: user.email,
                    role: user.role,
                    token: generateToken(user._id),
                },
            });
        }
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { emailOrUsername, password } = req.body;

        if (!emailOrUsername || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide email/username and password",
            });
        }

        const user = await User.findOne({
            $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
        }).select("+password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        if (user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Chỉ có quản trị viên mới có thể truy cập",
            });
        }

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        // Lưu phiên đăng nhập mới nhất
        user.currentSessionToken = accessToken;
        user.refreshToken = refreshToken;
        await user.save();

        res.status(200).json({
            success: true,
            data: {
                _id: user._id,
                username: user.username,
                fullname: user.fullname,
                email: user.email,
                role: user.role,
                accessToken: accessToken,
                refreshToken: refreshToken,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { fullname, avatar, phone, birthday, address, gender } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { fullname, avatar, phone, birthday, address, gender },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({ success: false, message: "Refresh token is required" });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || "refresh_secret_ksl_2026");
        const user = await User.findById(decoded.id);

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({ 
                success: false, 
                message: "Refresh token invalid hoặc đã bị đăng xuất từ thiết bị khác" 
            });
        }

        const newAccessToken = generateAccessToken(user._id);
        const newRefreshToken = generateRefreshToken(user._id);

        user.currentSessionToken = newAccessToken;
        user.refreshToken = newRefreshToken;
        await user.save();

        res.status(200).json({
            success: true,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });
    } catch (error) {
        res.status(401).json({ success: false, message: "Refresh token expired hoặc không hợp lệ" });
    }
};
