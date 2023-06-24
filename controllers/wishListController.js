const Wishlist = require("../models/wishListModel");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const User = require("../models/userModel");

exports.getAllWishlist = catchAsyncErrors(async (req, res, next) => {
  const wishlist = await Wishlist.find({ user: req.user._id }).populate(
    "items.item"
  );

  res.status(200).json({ success: true, wishlist });
});

exports.getWishlist = catchAsyncErrors(async (req, res, next) => {
  const { wishlistId } = req.params;

  if (!wishlistId) {
    return next(new ErrorHandler("Wish List Id not specified", 422));
  }

  const wishlist = await Wishlist.findById(wishlistId).populate("items");

  res.status(200).json({ success: true, wishlist });
});
exports.deleteWishList = catchAsyncErrors(async (req, res, next) => {
  const { wishlistId } = req.params;
  if (!wishlistId) {
    return next(new ErrorHandler("Wish List Id not specified", 422));
  }
  const wishlist = await Wishlist.findById(wishlistId);
  if (!wishlist) {
    return next(new ErrorHandler("Wish List not found", 404));
  }
  wishlist.deleteOne();

  res.status(200).json({ success: true });
});

exports.deleteItemInWishList = catchAsyncErrors(async (req, res, next) => {
  const { wishlistId } = req.params;
  const itemId = req.query.item;
  if (!wishlistId || !itemId) {
    return next(new ErrorHandler("Required ID's not specified", 422));
  }

  const wishlist = await Wishlist.findById(wishlistId);
  if (!wishlist) {
    return next(new ErrorHandler("Wish list not found", 404));
  }
  const item = wishlist.items.find((item) => item._id.toString() === itemId);
  if (!item) {
    return next(new ErrorHandler("Item not found", 404));
  }

  wishlist.items = wishlist.items.filter(
    (item) => item._id.toString() !== itemId
  );
  await wishlist.save();

  res.status(200).json({ success: true, wishlist });
});

exports.renameWishlist = catchAsyncErrors(async (req, res, next) => {
  const name = req.body.name;
  const { wishlistId } = req.params;

  if (!wishlistId || !name) {
    return next(new ErrorHandler());
  }
  const wishList = await Wishlist.findById(wishlistId);

  if (!wishList) {
    return next(new ErrorHandler("Wishlist not found", 404));
  }

  wishList.name = name;
  await wishList.save();

  res.status(200).json({ success: true, wishList });
});
