const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Not authorized to access this route",
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = await User.findById(decoded.id);

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "No user found with this id",
            });
        }

        // Kiểm tra xem token có thuộc phiên admin web hoặc phiên mobile không
        const isAdminSession = req.user.currentSessionToken && req.user.currentSessionToken === token;
        const isMobileSession = req.user.mobileSessionToken && req.user.mobileSessionToken === token;

        if (!isAdminSession && !isMobileSession) {
            return res.status(401).json({
                success: false,
                message: "Tài khoản của bạn đang đăng nhập trên thiết bị khác",
                code: "SESSION_EXPIRED"
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Not authorized to access this route",
        });
    }
};

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.user.role} is not authorized to access this route`,
            });
        }
        next();
    };
};
