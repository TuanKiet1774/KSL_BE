const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { generateOTP, sendOTPEmail } = require("../utils/emailService");

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

// ─── REGISTER: Tạo user chưa xác thực, gửi OTP ────────────────────────────────
exports.register = async (req, res) => {
    try {
        const { username, fullname, email, password, phone, birthday, address, gender } = req.body;

        // Kiểm tra tồn tại
        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            // Nếu user tồn tại nhưng chưa xác thực → cho phép gửi lại OTP
            if (!userExists.isVerified) {
                const otp = generateOTP();
                const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

                await User.findByIdAndUpdate(userExists._id, {
                    $set: {
                        otpCode: otp,
                        otpExpires,
                    },
                });

                await sendOTPEmail(userExists.email, userExists.fullname, otp);

                return res.status(200).json({
                    success: true,
                    message: "Tài khoản chưa được xác thực. Mã OTP mới đã được gửi đến email của bạn.",
                    email: userExists.email,
                });
            }

            return res.status(400).json({
                success: false,
                message: "Email hoặc username đã được sử dụng",
            });
        }

        // Tạo OTP
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

        // Tạo user với isVerified = false
        const user = await User.create({
            username,
            fullname,
            email,
            password,
            phone,
            birthday,
            address,
            gender,
            isVerified: false,
            otpCode: otp,
            otpExpires,
        });

        // Gửi email OTP
        await sendOTPEmail(email, fullname, otp);

        res.status(201).json({
            success: true,
            message: "Đăng ký thành công! Vui lòng kiểm tra email để lấy mã OTP xác nhận tài khoản.",
            email: user.email,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

// ─── VERIFY OTP: Xác nhận mã OTP ──────────────────────────────────────────────
exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng cung cấp email và mã OTP",
            });
        }

        // Lấy user kèm otpCode và otpExpires (select: false nên phải select rõ)
        const user = await User.findOne({ email }).select("+otpCode +otpExpires");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy tài khoản với email này",
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: "Tài khoản đã được xác thực trước đó",
            });
        }

        if (!user.otpCode || !user.otpExpires) {
            return res.status(400).json({
                success: false,
                message: "Mã OTP không hợp lệ. Vui lòng yêu cầu gửi lại OTP",
            });
        }

        if (new Date() > user.otpExpires) {
            return res.status(400).json({
                success: false,
                message: "Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại OTP",
            });
        }

        if (user.otpCode !== otp.toString()) {
            return res.status(400).json({
                success: false,
                message: "Mã OTP không chính xác",
            });
        }

        // Xác thực thành công → kích hoạt tài khoản, xóa OTP
        user.isVerified = true;
        user.otpCode = null;
        user.otpExpires = null;
        await user.save();

        // Tạo token đăng nhập luôn sau khi xác thực
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        user.currentSessionToken = accessToken;
        user.refreshToken = refreshToken;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Xác thực tài khoản thành công!",
            data: {
                _id: user._id,
                username: user.username,
                fullname: user.fullname,
                email: user.email,
                role: user.role,
                accessToken,
                refreshToken,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ─── RESEND OTP: Gửi lại mã OTP ───────────────────────────────────────────────
exports.resendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng cung cấp email",
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy tài khoản với email này",
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: "Tài khoản đã được xác thực",
            });
        }

        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

        user.otpCode = otp;
        user.otpExpires = otpExpires;
        await user.save();

        await sendOTPEmail(email, user.fullname, otp);

        res.status(200).json({
            success: true,
            message: "Mã OTP mới đã được gửi đến email của bạn",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ─── LOGIN ─────────────────────────────────────────────────────────────────────
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
                message: "Thông tin đăng nhập chưa chính xác",
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Thông tin đăng nhập chưa chính xác",
            });
        }

        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: "Tài khoản chưa được xác thực. Vui lòng kiểm tra email để lấy mã OTP",
                requireVerification: true,
                email: user.email,
            });
        }

        if (user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Tài khoản không có quyền truy cập vào hệ thống quản trị",
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

// ─── GET PROFILE ───────────────────────────────────────────────────────────────
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

// ─── UPDATE PROFILE ────────────────────────────────────────────────────────────
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

// ─── REFRESH TOKEN ─────────────────────────────────────────────────────────────
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
                message: "Refresh token invalid hoặc đã bị đăng xuất từ thiết bị khác",
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
