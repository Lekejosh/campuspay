const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
      default: function genUUID() {
        return require("uuid").v4();
      },
    },
    fullName: {
      type: String,
      required: [true, "Please enter your Full name"],
      minlength: [8, "Full Name cannot exceed 8 Characters"],
    },
    email: {
      type: String,
      unique: true,
      required: [true, "Please enter your email Address"],
      validate: [validator.isEmail, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Please enter your password"],
      minLength: [8, "Password cannot be less than 8 characters"],
      select: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    username: {
      type: String,
      unique: true,
    },
    dob: {
      type: Date,
    },
    mobileNumber: {
      type: String,
    },
    nationality: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      required: true,
    },
    avatar: {
      public_id: { type: String, default: "default_image" },
      url: {
        type: String,
        default:
          "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
      },
    },
    role: {
      type: String,
      enum: ["user", "seller", "admin",'student','staff'],
      default: "user",
    },
    generatedOtp: String,
    generatedOtpExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.getAccessToken = function () {
  return jwt.sign({ id: this._id }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRE,
  });
};

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  return resetToken;
};
module.exports = mongoose.model("User", userSchema);
