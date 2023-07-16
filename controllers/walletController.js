const Wallet = require("../models/walletModel");
const User = require("../models/userModel");
const Notification = require("../models/notificationModel");
const TransactionHistory = require("../models/transactionHistoryModel");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");

exports.createWallet = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  const { currency } = req.body;

  const wallet = await Wallet.create({
    userId: req.user._id,
    currency: currency,
    history: { content: `You created this ${currency} wallet` },
  });

  await Notification.create({
    userId: req.user._id,
    content: `You have successfully created a ${currency} wallet.`,
    type: "wallet",
    typeId: wallet._id,
  });

  await TransactionHistory.create({
    userId: req.user._id,
    content: `You created a new ${currency} wallet`,
  });

  res.status(201).json({ success: true, wallet });
});

exports.getWallet = catchAsyncErrors(async (req, res, next) => {
  const { walletId } = req.params;

  if (!walletId) {
    return next(new ErrorHandler("Wallet Id not provided", 422));
  }

  const wallet = await Wallet.findById(walletId);

  if (!wallet) {
    return next(new ErrorHandler("Wallet not found", 404));
  }

  res.status(200).json({ success: true, wallet });
});

exports.getAllWallet = catchAsyncErrors(async (req, res, next) => {
  const wallet = await Wallet.find({ userId: req.user._id });

  res.status(200).json({ success: true, wallet });
});

exports.deleteWallet = catchAsyncErrors(async (req, res, next) => {
  const { walletId } = req.params;
  if (!walletId) {
    return next(new ErrorHandler("Wallet Id not provided", 422));
  }

  const wallet = await Wallet.findById(walletId);

  if (!wallet) {
    return next(new ErrorHandler("Wallet not found", 404));
  }

  if (wallet.balance > 0) {
    return next(
      new ErrorHandler("Can't delete a wallet with money inside", 403)
    );
  }
  await TransactionHistory.create({
    userId: req.user._id,
    content: `Deleted ${wallet.currency}`,
  });
  await wallet.deleteOne();

  res.status(200).json({ success: true });
});

exports.transferToWallet = catchAsyncErrors(async (req, res, next) => {
  const { from, to, amount, pin } = req.body;

  if (!from || !to || !amount) {
    return next(new ErrorHandler("Required parameters not provided", 422));
  }

  const walletFrom = await Wallet.findById(from).populate("userId", "username");

  if (!walletFrom) {
    return next(new ErrorHandler("Sender Wallet not found", 404));
  }

  const walletTo = await Wallet.findById(to).populate("userId", "username");

  if (!walletTo) {
    return next(new ErrorHandler("Receiver Wallet not found", 404));
  }

  if (walletFrom.userId._id.toString() !== req.user._id.toString()) {
    return next(new ErrorHandler("Unauthorized Transaction", 403));
  }

  const user = await User.findById(req.user._id).select("+transactionPin");
  console.log(user);

  const isPinMatched = await user.compareTransactionPin(pin);

  if (!isPinMatched) {
    return next(new ErrorHandler("Pin not correct", 403));
  }

  if (walletFrom.currency !== walletTo.currency) {
    return next(
      new ErrorHandler(
        "Receiver wallet currency type must be the same as yours",
        401
      )
    );
  }

  if (walletFrom.balance < amount) {
    return next(
      new ErrorHandler("Insufficient funds to carry out this transaction", 403)
    );
  }

  walletTo.balance += amount;
  walletTo.history.push({
    content: `You received ${amount} from ${walletFrom.userId.username}`,
  });
  await walletTo.save();

  walletFrom.balance -= amount;
  walletFrom.history.push({
    content: `You Sent ${amount} to ${walletTo.userId.username}`,
  });
  await walletFrom.save();

  await TransactionHistory.create({
    userId: req.user._id,
    content: `You Sent ${amount} ${walletFrom.currency} to ${walletTo.userId.username}`,
  });

  await TransactionHistory.create({
    userId: walletTo.userId._id,
    content: `You Received ${amount} ${walletFrom.currency} from ${walletFrom.userId.username}`,
  });

  await Notification.create({
    type: "wallet",
    typeId: from,
    content: `You Sent ${amount} ${walletFrom.currency} to ${walletTo.userId.username}`,
    userId: req.user._id,
  });

  await Notification.create({
    type: "wallet",
    typeId: to,
    content: `You Received ${amount} ${walletFrom.currency} from ${walletFrom.userId.username}`,
    userId: walletTo.userId._id,
  });

  res.status(200).json({
    success: true,
    message: "Transfer successful",
  });
});

exports.depositIntoWallet = catchAsyncErrors(async (req, res, next) => {});
