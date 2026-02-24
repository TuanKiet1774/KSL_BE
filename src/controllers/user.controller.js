const User = require("../models/User");
const paginate = require("../utils/pagination");
const jwt = require("jsonwebtoken");

const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  const userObj = user.toObject();
  delete userObj.password;

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    token,
    data: userObj,
  });
};

exports.register = async (req, res) => {
  try {
    const { username, fullname, email, password, role } = req.body;

    const user = await User.create({
      username,
      fullname,
      email,
      password,
      role
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide an email and password",
      });
    }

    const user = await User.findOne({ email }).select("+password");

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

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const {
      username,
      fullname,
      phone,
      birthday,
      address,
      email,
      role,
      level,
      isActive,
      page,
      limit,
      sortBy,
      sortOrder,
      search,
    } = req.query;

    const query = {};

    if (search) {
      query.$text = { $search: search };
    }
    if (username) {
      query.username = { $regex: username, $options: "i" };
    }
    if (fullname) {
      query.fullname = { $regex: fullname, $options: "i" };
    }
    if (email) {
      query.email = { $regex: email, $options: "i" };
    }
    if (phone) {
      query.phone = { $regex: phone, $options: "i" };
    }
    if (address) {
      query.address = { $regex: address, $options: "i" };
    }
    if (role) {
      query.role = role;
    }
    if (level) {
      query.level = level;
    }
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }
    if (birthday) {
      const date = new Date(birthday);
      if (!isNaN(date)) {
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));
        query.birthday = { $gte: startOfDay, $lte: endOfDay };
      }
    }

    const result = await paginate(User, query, {
      page,
      limit,
      sortBy,
      sortOrder,
      select: "-password",
    });

    res.status(200).json({
      success: true,
      count: result.data.length,
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.createUser = async (req, res) => {
  try {
    const user = await User.create(req.body);
    sendTokenResponse(user, 201, res);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};