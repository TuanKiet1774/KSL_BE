const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      index: true,
    },

    fullname: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
      index: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      index: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },

    phone: {
      type: String,
      trim: true,
      match: /^[0-9]{9,11}$/,
      index: true,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },

    avatar: {
      type: String,
      default: "src/assets/user.jpg",
    },

    birthday: {
      type: Date,
      index: true,
    },

    address: {
      type: String,
      trim: true,
      index: true,
    },

    level: { //Level để xác nhận cấp độ của người dùng
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
      index: true,
    },

    points: { //Điểm hiện tại của người dùng, dùng để mở khoá các question
      type: Number,
      default: 0,
    },

    exp: { //Kinh nghiệm hiện tại của người dùng, dùng để mở khoá các 
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.index({ username: "text", fullname: "text", email: "text", address: "text" });
userSchema.index({ role: 1, isActive: 1 });

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
