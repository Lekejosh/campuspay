const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
  const { cookie } = req.cookies;
  if (!cookie) {
    return next(new ErrorHandler("Please Login to access this resource", 401));
  }
  const decodedData = jwt.verify(cookie, process.env.ACCESS_TOKEN_SECRET);
  req.user = await User.findById(decodedData.id);
  next();
});
exports.authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          `Role: ${req.user.role} is not allowed to access this resource`,
          403
        )
      );
    }
    next();
  };
};
exports.deactivated = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (user.isDeactivated) {
    return next(new ErrorHandler("You account has been deactivated",401));
  }

  next();
});
