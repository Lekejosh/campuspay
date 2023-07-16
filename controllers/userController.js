const User = require("../models/userModel");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const Post = require("../models/postModel");
const ErrorHandler = require("../utils/errorHandler");
const { sendToken, extendedToken } = require("../utils/jwtToken");
const sendEmail = require("../utils/sendMail");
const cache = require("../utils/cache");
const { generateOTP } = require("../utils/otpGenerator");
const cloudinary = require("cloudinary");
const crypto = require("crypto");
const Wishlist = require("../models/wishListModel");
const Notification = require("../models/notificationModel");
const Order = require("../models/orderModel");
const axios = require("axios");
exports.registerUser = catchAsyncErrors(async (req, res, next) => {
  const {
    fullName,
    email,
    password,
    username,
    dob,
    nationality,
    gender,
    mobileNumber,
  } = req.body;

  const checkExistingUser = async (key, value) => {
    const existingUser = await User.findOne({ [key]: value });
    if (existingUser) {
      return `${key} ${value} is already taken`;
    }
  };
  const errors = await Promise.all([
    checkExistingUser("email", email),
    checkExistingUser("username", username),
    checkExistingUser("mobileNumber", mobileNumber),
  ]);

  const error = errors.find((e) => e);
  if (error) {
    return next(new ErrorHandler(error, 409));
  }

  const user = await User.create({
    fullName,
    email,
    password,
    username,
    dob,
    gender,
    mobileNumber,
    nationality,
    transactionPin:1234,
    generatedOtp: generateOTP(),
    generatedOtpExpire: Date.now() + 15 * 60 * 1000,
  });
  // try {
  //   const data = `Your email Verification Token is :-\n]n ${user.generatedOtp} (This is only available for 15Minutes!)\n\nIf you have not requested this email then, please Ignore it`;
  //   await sendEmail({
  //     email: `${user.username} <${user.email}>`,
  //     subject: "Verify Account",
  //     html: data,
  //   });
  // } catch (error) {
  //   user.generatedOTP = undefined;
  //   (user.generatedOtpExpire = undefined),
  //     await user.save({ validateBeforeSave: false });
  //   return next(new ErrorHandler(error.message, 500));
  // }
  user.getAccessToken();
  sendToken(user, 201, res);
});

exports.verifyEmail = catchAsyncErrors(async (req, res, next) => {
  const { otp } = req.body;
  const now = Date.now();
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  if (otp !== user.generatedOtp || user.generatedOtpExpire <= now) {
    return next(new ErrorHandler("OTP is invalid or Expired", 401));
  }

  user.isVerified = true;
  user.generatedOtp = undefined;
  user.generatedOtpExpire = undefined;
  await user.save();

  await sendEmail({
    email: `${user.username} <${user.email}>`,
    subject: "Account Verified",
    html: "Account Verified Successfully",
  });

  res
    .status(200)
    .json({ success: true, message: "Email Verified Successfully" });
});

exports.resendOtp = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }
  if (user.isVerified) {
    return next(new ErrorHandler("Email Address Already Verified", 400));
  }

  user.generatedOtp = generateOTP();
  user.generatedOtpExpire = Date.now() + 15 * 60 * 1000;
  await user.save();

  try {
    const data = `Your email verification Token is :-\n\n ${user.generatedOtp} (This is only available for 15 Minutes!)\n\nif you have not requested this email then please ignore it`;
    await sendEmail({
      email: `${user.username} <${user.email}>`,
      subject: "Verify Account",
      html: data,
    });
  } catch (error) {
    user.generatedOtp = undefined;
    user.generatedOtpExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorHandler(error.message, 500));
  }
  res.status(200).json({ success: true, message: "OTP sent successfully" });
});

exports.loginUser = catchAsyncErrors(async (req, res, next) => {
  const { emailUserMobile, password, rememberMe } = req.body;
  if (!emailUserMobile || !password) {
    return next(new ErrorHandler("Credentials not provided", 422));
  }

  const user = await User.findOne({
    $or: [
      { email: emailUserMobile },
      { mobileNumber: emailUserMobile },
      { username: emailUserMobile },
    ],
  }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid Credentials", 401));
  }
  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid Credentials", 401));
  }

  user.getAccessToken();

  if (rememberMe) {
    return extendedToken(user, 200, res);
  }

  sendToken(user, 200, res);
});

exports.logoutUser = catchAsyncErrors(async (req, res, next) => {
  const cookie = req.cookies.cookie;
  if (!cookie) {
    return next(new ErrorHandler("Cookie not present", 400));
  }
  const user = await User.findById(req.user._id);
  res.clearCookie("cookie", {
    httpOnly: true,
  });
  if (!user)
    return next(new ErrorHandler("User not found or already logged out", 404));

  res.status(200).json({ success: true, message: "Logged out successfully" });
});

exports.changeUsername = catchAsyncErrors(async (req, res, next) => {
  const { username } = req.body;

  if (!username) {
    return next(new ErrorHandler("Username not provided", 422));
  }

  const existingUserName = await User.findOne({ username: username });

  if (existingUserName) {
    return next(new ErrorHandler("Username already exist", 401));
  }

  const user = await User.findById(req.user._id);

  user.username = username;

  await user.save();
  res
    .status(200)
    .json({ success: true, message: "Username changed Successfully" });
});

exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
  const { nationality, dob, mobileNumber } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  if (nationality) {
    user.nationality = nationality;
  }
  if (dob) {
    user.dob = dob;
  }
  if (mobileNumber) {
    user.mobileNumber = mobileNumber;
  }
  await user.save();
  res.status(200).json({ success: true, user });
});

exports.getMe = catchAsyncErrors(async (req, res, next) => {
  //   const cachedUser = await cache.get(req.user._id);

  //   if (cachedUser) {
  //     const userData = JSON.parse(cachedUser);
  //     return res.status(200).json(userData);
  //   }

  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  //   cache.set(req.user._id, userData);

  res.status(200).json({ success: true, user });
});
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const { emailUserMobile } = req.body;

  if (!emailUserMobile)
    return next(
      new ErrorHandler("Please Provide Email/Mobile Number/Username", 400)
    );

  const user = await User.findOne({
    $or: [
      { email: emailUserMobile },
      { mobileNumber: emailUserMobile },
      { username: emailUserMobile },
    ],
  });

  if (!user) {
    return next(new ErrorHandler("User Not found", 404));
  }

  if (user.isDeactivated) {
    return next(new ErrorHandler("Account Deactivated, Contact Support", 403));
  }

  const resetToken = user.getResetPasswordToken();
  user.save({ ValidateBeforeSave: false });

  const resetPasswordUrl = `${req.protocol}://${req.get(
    "host"
  )}/password/reset/${resetToken}`;

  const message = `Your password reset Token is :-\n\n ${resetPasswordUrl} \n\nif you have not requested this email then, please Ignore it`;
  try {
    await sendEmail({
      email: user.email,
      subject: `User Password Recovery`,
      html: message,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });
    return next(new ErrorHandler(error.message, 500));
  }
  res
    .status(200)
    .json({ success: true, message: "Reset Link Sent, Check your Mail!" });
});

exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  if (!req.body.newPassword || !req.body.confirmPassword) {
    return next(new ErrorHandler("Credentials not provided", 422));
  }

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorHandler("Reset Password Token is invalid", 401));
  }

  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(new ErrorHandler("Password does not Match", 400));
  }
  const message = `Your password has been changed successfully`;
  await sendEmail({
    email: user.email,
    subject: `Password Changed Successfully`,
    html: message,
  });
  user.password = req.body.newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();
  res
    .status(200)
    .json({ success: true, message: "Password Changed Successfully" });
});
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (!oldPassword || !newPassword || !confirmPassword) {
    return next(new ErrorHandler("All Credentials not Provided"));
  }

  const user = await User.findById(req.user.id).select("+password");
  const isPasswordMatched = await user.comparePassword(oldPassword);

  if (!isPasswordMatched)
    return next(new ErrorHandler("Current Password is wrong!!!", 400));

  if (newPassword !== confirmPassword)
    return next(
      new ErrorHandler("New Password and Confirm Password does not match", 400)
    );

  user.password = newPassword;
  user.save();

  res
    .status(200)
    .json({ success: true, message: "Password Update Successfully" });
});

exports.updateRoleToStudentOrStaff = catchAsyncErrors(
  async (req, res, next) => {
    const { role, idNumber, university } = req.body;

    if (!role || !idNumber || !university) {
      return next(new ErrorHandler("Required Credentials not provided", 422));
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }
    user.role = role;
    user.idNumber = idNumber;
    user.university = university;
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "User updated successfully" });
  }
);

//TODO: Wait for sandbox to fix there API before proceeding

exports.bvn = catchAsyncErrors(async (req, res, next) => {
  const { number } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  await axios
    .post(
      `${process.env.BVN_API}bvnr/GetSingleBVN`,
      { number },
      {
        headers: {
          "Content-Type": "application/json",
          "Sandbox-key": process.env.SANDBOX_API_KEY,
          Accept: "application/json",
        },
      }
    )
    .then((res) => {
      return res.json(res);
    });
});

exports.deleteAccount = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new ErrorHandler("User Not found", 404));
  }

  await Wishlist.deleteMany({ user: req.user._id });
  await Notification.deleteMany({ userId: req.user._id });
  await Post.deleteMany({ author: req.user._id });
  await Order.deleteMany({ user: req.user._id });

  await user.deleteOne();

  res.clearCookie("cookie", {
    httpOnly: true,
  });

  res.status(204).end();
});
