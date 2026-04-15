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
      message: "Không được phép truy cập vào route này",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy người dùng với id này",
      });
    }

    const isAdminSession = req.user.currentSessionToken && req.user.currentSessionToken === token;
    const isMobileSession = req.user.mobileSessionToken && req.user.mobileSessionToken === token;

    if (!isAdminSession && !isMobileSession) {
      return res.status(401).json({
        success: false,
        message: "Tài khoản của bạn đang đăng nhập trên thiết bị khác",
        code: "SESSION_EXPIRED",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Không được phép truy cập vào route này",
    });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Vai trò người dùng ${req.user.role} không được phép truy cập vào route này`,
      });
    }
    next();
  };
};
