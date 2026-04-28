const User = require("../models/User");
const Progress = require("../models/Progress");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "access_secret_ksl_2026", {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_REFRESH_SECRET || "refresh_secret_ksl_2026",
    {
      expiresIn: "7d",
    },
  );
};

exports.register = async (req, res) => {
  try {
    const {
      username,
      fullname,
      email,
      password,
      phone,
      birthday,
      address,
      gender,
    } = req.body;

    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "Email hoặc username đã được sử dụng",
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
      gender,
    });

    res.status(201).json({
      success: true,
      message: "Đăng ký thành công!",
      data: {
        _id: user._id,
        username: user.username,
        fullname: user.fullname,
        email: user.email,
      },
    });
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

    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Tài khoản không có quyền truy cập vào hệ thống quản trị",
      });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.currentSessionToken = accessToken;
    user.refreshToken = refreshToken;
    await user.save();

    await Progress.findOneAndUpdate(
      { userId: user._id },
      {
        $push: {
          accessHistory: { sessionStart: Date.now(), activity: "login_web" }
        },
        $set: { "stats.lastActivity": Date.now() }
      },
      { upsert: true }
    );

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

const getSessionToken = (req, user) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (user.mobileSessionToken && user.mobileSessionToken === token) {
    return { accessToken: user.mobileSessionToken, refreshToken: user.mobileRefreshToken };
  }
  return { accessToken: user.currentSessionToken, refreshToken: user.refreshToken };
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const tokens = getSessionToken(req, user);
    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        birthday: user.birthday,
        address: user.address,
        gender: user.gender,
        exp: user.exp,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
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
      { new: true, runValidators: true },
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
      return res
        .status(401)
        .json({ success: false, message: "Refresh token is required" });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || "refresh_secret_ksl_2026",
    );
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token invalid hoặc đã bị đăng xuất từ thiết bị khác",
      });
    }

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    await User.findByIdAndUpdate(user._id, {
      currentSessionToken: newAccessToken,
      refreshToken: newRefreshToken,
    });

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    res
      .status(401)
      .json({
        success: false,
        message: "Refresh token expired hoặc không hợp lệ",
      });
  }
};

exports.loginMobile = async (req, res) => {
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

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    await User.findByIdAndUpdate(user._id, {
      mobileSessionToken: accessToken,
      mobileRefreshToken: refreshToken,
    });

    await Progress.findOneAndUpdate(
      { userId: user._id },
      {
        $push: {
          accessHistory: { sessionStart: Date.now(), activity: "login_mobile" }
        },
        $set: { "stats.lastActivity": Date.now() }
      },
      { upsert: true }
    );

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        birthday: user.birthday,
        address: user.address,
        gender: user.gender,
        level: "",
        exp: user.exp,
        accessToken: accessToken,
        refreshToken: refreshToken,
      },
    });
  } catch (error) {
    console.error("Login Mobile Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.refreshTokenMobile = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res
        .status(401)
        .json({ success: false, message: "Refresh token is required" });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || "refresh_secret_ksl_2026",
    );
    const user = await User.findById(decoded.id);

    if (!user || user.mobileRefreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token không hợp lệ hoặc đã bị đăng xuất từ thiết bị khác",
      });
    }

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    await User.findByIdAndUpdate(user._id, {
      mobileSessionToken: newAccessToken,
      mobileRefreshToken: newRefreshToken,
    });

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    res
      .status(401)
      .json({
        success: false,
        message: "Refresh token đã hết hạn hoặc không hợp lệ",
      });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới",
      });
    }

    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Mật khẩu hiện tại không chính xác",
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Đổi mật khẩu thành công!",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.verifyPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp mật khẩu",
      });
    }

    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Mật khẩu không chính xác",
      });
    }

    res.status(200).json({
      success: true,
      message: "Mật khẩu chính xác",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.verifyIdentity = async (req, res) => {
  try {
    const { username, email } = req.body;

    if (!username || !email) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp username và email",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    if (user.username !== username || user.email !== email) {
      return res.status(401).json({
        success: false,
        message: "Username hoặc Email không chính xác",
      });
    }

    res.status(200).json({
      success: true,
      message: "Xác thực danh tính thành công",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
