const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { updateStastic } = require("../utils/stasticManager");


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
      validate: {
        validator: function(v) {
          return /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>])(?!.*\s).+$/.test(v);
        },
        message: "Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ số, 1 ký tự đặc biệt và không chứa khoảng trắng"
      },
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
      default: "",
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

    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
      index: true,
    },

    exp: {
      type: Number,
      default: 0,
    },
    currentSessionToken: {
      type: String,
      default: null,
    },
    refreshToken: {
        type: String,
        default: null,
    }
  },
  {
    timestamps: true,
  },
);

userSchema.index({
  username: "text",
  fullname: "text",
  email: "text",
  address: "text",
});
userSchema.index({ role: 1 });

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Middleware to track if it's a new document
userSchema.pre("save", async function () {
  this.wasNew = this.isNew;
});

userSchema.post("save", async function (doc) {
  if (this.wasNew) {
    await updateStastic("userCount", 1);
  }
});

userSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await updateStastic("userCount", -1);
  }
});

module.exports = mongoose.model("User", userSchema);
