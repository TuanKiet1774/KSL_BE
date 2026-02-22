const User = require("../models/User");

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
      isActive,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
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
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;
    const users = await User.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .select("-password");

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      pagination: {
        totalPage: Math.ceil(total / limitNum),
        currentPage: parseInt(page),
        limit: limitNum,
      },
      data: users,
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
    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json({
      success: true,
      data: userObj,
    });
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