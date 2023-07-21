const Wallet = require("../models/walletModel");
const User = require("../models/userModel");
const Notification = require("../models/notificationModel");
const TransactionHistory = require("../models/transactionHistoryModel");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const Card = require("../models/cardModel");
const { default: axios } = require("axios");
const Order = require("../models/orderModel");

exports.depositIntoMainAccount = catchAsyncErrors(async (req, res, next) => {
  const { cardNumber, cardDate, cardType, amount, saveCard } = req.body;

  if (!cardNumber || !cardDate || !cardType || !amount) {
    return next(new ErrorHandler("All card details not provided", 422));
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new ErrorHandler("user not found", 404));
  }

  if (saveCard) {
    await Card.create({
      user: req.user._id,
      cardNumber: cardNumber,
      expiryDate: cardDate,
      cardType: cardType,
    });
  }

  user.mainBalance += amount;
  await user.save();

  res.status(200).json({ success: true, message: "Deposit success" });
});

exports.createWallet = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  const { currency } = req.body;
  const currencyPrefixes = {
    NGN: "01",
    USD: "02",
    GBP: "03",
  };

  if (!currencyPrefixes[currency]) {
    return next(new ErrorHandler("Invalid currency code", 400));
  }

  const accountNumber = Math.floor(10000000 + Math.random() * 90000000);

  const formattedAccountNumber = currencyPrefixes[currency] + accountNumber;

  const wallet = await Wallet.create({
    userId: req.user._id,
    currency: currency,
    accountNumber: formattedAccountNumber,
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
    type: "create",
  });

  res.status(201).json({ success: true, wallet });
});

exports.getWallet = catchAsyncErrors(async (req, res, next) => {
  const { accountNumber } = req.params;

  if (!accountNumber) {
    return next(new ErrorHandler("Account Number not provided", 422));
  }

  const wallet = await Wallet.findOne({ accountNumber: accountNumber });

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
  const { accountNumber } = req.params;
  if (!accountNumber) {
    return next(new ErrorHandler("Account Number not provided", 422));
  }

  const wallet = await Wallet.findOne({ accountNumber: accountNumber });

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
    type: "delete",
  });
  await wallet.deleteOne();

  res.status(200).json({ success: true });
});

exports.transferToWallet = catchAsyncErrors(async (req, res, next) => {
  const { from, to, amount, pin } = req.body;

  if (!from || !to || !amount || !pin) {
    return next(new ErrorHandler("Required parameters not provided", 422));
  }

  if (from === to) {
    return next(
      new ErrorHandler("You can't send to, from the same account", 403)
    );
  }

  const walletFrom = await Wallet.findOne({ accountNumber: from }).populate(
    "userId",
    "username"
  );

  if (!walletFrom) {
    return next(new ErrorHandler("Sender Wallet not found", 404));
  }

  const walletTo = await Wallet.findOne({ accountNumber: to }).populate(
    "userId",
    "username"
  );

  if (!walletTo) {
    return next(new ErrorHandler("Receiver Wallet not found", 404));
  }

  if (walletFrom.userId._id.toString() !== req.user._id.toString()) {
    return next(new ErrorHandler("Unauthorized Transaction", 403));
  }

  const user = await User.findById(req.user._id).select("+transactionPin");

  if (!user.transactionPin) {
    return next(new ErrorHandler("Please Create transaction pin", 400));
  }

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
    type: "debit",
  });

  await TransactionHistory.create({
    userId: walletTo.userId._id,
    content: `You Received ${amount} ${walletFrom.currency} from ${walletFrom.userId.username}`,
    type: "credit",
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

exports.depositIntoWallet = catchAsyncErrors(async (req, res, next) => {
  const { amount, accountNumber } = req.body;

  if (!amount || !accountNumber) {
    return next(new ErrorHandler("Required Paramater not provided", 422));
  }

  const user = await User.findById(req.user._id);

  if (user.mainBalance < amount) {
    return next(new ErrorHandler("Insufficient funds", 403));
  }

  const wallet = await Wallet.findOne({ accountNumber: accountNumber });

  if (!wallet) {
    return next(new ErrorHandler("Wallet not found", 404));
  }

  user.mainBalance -= amount;
  wallet.balance += amount;
  wallet.history.push({
    content: `Deposited ${amount} into ${wallet.accountNumber}`,
  });
  await wallet.save();
  await user.save();

  await TransactionHistory.create({
    userId: req.user._id,
    content: `Deposit ${amount}`,
    type: "deposit",
  });

  res.status(200).json({ success: true, wallet });
});

exports.createTransactionPin = catchAsyncErrors(async (req, res, next) => {
  const { newPin, confirmNewPin, securityQuestion, securityAnswer } = req.body;

  const pins = ["1234", "4321", "0001", "0000"];

  if (pins.includes(newPin)) {
    return next(
      new ErrorHandler("This pins is not allowed, because it guessable", 400)
    );
  }

  if (!newPin || !confirmNewPin || !securityQuestion || !securityAnswer) {
    return next(new ErrorHandler("All Required parameters not provided", 422));
  }

  if (newPin !== confirmNewPin) {
    return next(new ErrorHandler("Pin does not match", 401));
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  user.transactionPin = newPin;
  user.security.question = securityQuestion;
  user.security.answer = securityAnswer;
  await user.save();

  res
    .status(200)
    .json({ success: true, message: "Transaction pin created successfully" });
});

exports.getSecurityQuestion = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("+security.question");

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  if (!user.security.question) {
    return next(new ErrorHandler("Please create your transaction pin", 400));
  }

  res.status(200).json({ success: true, data: user.security.question });
});

exports.changeTransactionPin = catchAsyncErrors(async (req, res, next) => {
  const { oldPin, newPin, confirmNewPin } = req.body;

  if (!oldPin || !newPin || !confirmNewPin) {
    return next(new ErrorHandler("All Required Parameters not provided", 422));
  }

  const user = await User.findById(req.user._id).select("+transactionPin");

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  const compareTransactionPin = await user.compareTransactionPin(oldPin);

  if (!compareTransactionPin) {
    return next(new ErrorHandler("Old Transaction Pin is wrong", 403));
  }

  if (newPin !== confirmNewPin) {
    return next(new ErrorHandler("New Pin does not match", 403));
  }

  user.transactionPin = newPin;
  await user.save();

  res.status(200).json({ success: true, message: "Pin Changed Succefully" });
});

// exports.resetTransactionPin = catchAsyncErrors(async (req, res, next) => {
//   const {} = req.body;
// });

exports.requestPayment = catchAsyncErrors(async (req, res, next) => {
  const { username, amount, currency, description } = req.body;

  if (!username || !amount || !currency) {
    return next(new ErrorHandler("All Required parameters not provided", 422));
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  const userRequestingFrom = await User.findOne({ username: username });

  if (!userRequestingFrom) {
    return next(
      new ErrorHandler(`User with this username: ${username}, not found`, 401)
    );
  }

  await TransactionHistory.create({
    userId: req.user._id,
    content:
      "You made a request of " + amount + +currency + " from " + username,
    type: "request",
    description: description,
  });

  await Notification.create({
    userId: userRequestingFrom._id,
    type: "request",
    content:
      req.user.username + " Made a payment request of " + amount + currency,
  });

  res.status(200).json({ success: true, message: "Request send successfully" });
});

exports.withdrawMoney = catchAsyncErrors(async (req, res, next) => {
  const {
    accountNumber,
    bankCode,
    amount,
    currency,
    walletAccountNumber,
    pin,
  } = req.body;

  if (
    !accountNumber ||
    !bankCode ||
    !amount ||
    !currency ||
    !walletAccountNumber ||
    !pin
  ) {
    return next(new ErrorHandler("All required parameters not provided", 422));
  }

  const lookUpBank = await axios.get(
    `${process.env.BVN_API}v1/flutterwave/v3/banks/NG?country=NG`,
    {
      headers: {
        "Content-Type": "application/json",
        "Sandbox-key": process.env.SANDBOX_API_KEY,
        Accept: "application/json",
        Authorization: "dskjdks",
      },
    }
  );

  const verifyBankCode = lookUpBank.data.data.find(
    (bank) => bank.code === bankCode
  );

  if (!verifyBankCode) {
    return next(new ErrorHandler("Accepting Bank not found", 400));
  }

  const user = await User.findById(req.user._id).select("+transactionPin");

  const wallet = await Wallet.findOne({ accountNumber: walletAccountNumber });

  if (!wallet) {
    return next(
      new ErrorHandler("Wallet with this account Number not found", 404)
    );
  }

  if (wallet.userId.toString() !== req.user._id.toString()) {
    return next(new ErrorHandler("Forbidden", 403));
  }

  if (!user.transactionPin) {
    return next(new ErrorHandler("Please create your transaction pin", 400));
  }

  const verifyPin = await user.compareTransactionPin(pin);

  if (!verifyPin) {
    return next(new ErrorHandler("Transaction Pin not correct", 403));
  }

  if (wallet.amount < amount) {
    return next(new ErrorHandler("Insufficient Fund", 403));
  }

  const transfer = await axios.post(
    `${process.env.BVN_API}v1/flutterwave/v3/transfers`,
    {
      account_bank: "044",
      account_number: "0690000040",
      amount: 5500,
      narration: "Akhlm Pstmn Trnsfr xx007",
      currency: "NGN",
      reference: "akhlm-pstmnpyt-rfxx007_PMCKDU_1",
      callback_url: "https://webhook.site/b3e505b0-fe02-430e-a538-22bbbce8ce0d",
      debit_currency: "NGN",
    },
    {
      headers: {
        "Content-Type": "application/json",
        "Sandbox-key": process.env.SANDBOX_API_KEY,
        Accept: "application/json",
        Authorization: "dskjdks",
      },
    }
  );

  wallet.balance -= amount;
  wallet.history.push({
    content: `You made a withdraw of ${amount} ${currency}`,
  });
  wallet.save();

  await TransactionHistory.create({
    userId: req.user._id,
    content: `You made a withdraw of ${amount} ${currency}`,
    type: "withdrawal",
  });

  res.status(200).json({
    success: true,
    message: "Transfer Success",
    data: transfer.data,
  });
});

exports.payForOrder = catchAsyncErrors(async (req, res, next) => {
  const { orderId, fromWallet, amount, pin } = req.body;

  if (!orderId || !fromWallet || !amount || !pin) {
    return next(new ErrorHandler("All Parameters not provided", 422));
  }

  const order = await Order.findById(orderId);

  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }

  if (order.user !== req.user._id) {
    return next(new ErrorHandler("You can't pay for someone else's order"));
  }

  const wallet = await Wallet.findOne({ accountNumber: fromWallet });

  if (!wallet) {
    return next(new ErrorHandler("Wallet not found", 404));
  }

  if (amount > wallet.balance) {
    return next(new ErrorHandler("Insufficient fund", 403));
  }

  const sellerAccount = await User.findById(order.items.seller);

  if (!sellerAccount) {
    return next(new ErrorHandler("Seller not found"));
  }

  const user = await User.findById(req.user._id).select("+transactionPin");

  if (!user.transactionPin) {
    return next(new ErrorHandler("Please Create transaction pin", 400));
  }

  const isPinMatched = await user.compareTransactionPin(pin);

  if (!isPinMatched) {
    return next(new ErrorHandler("Pin not correct", 403));
  }

  sellerAccount.mainBalance += amount;
  await sellerAccount.save();

  await Notification.create({
    userId: sellerAccount._id,
    type: "order",
    content: req.user.username + " Paid for an order",
  });

  await TransactionHistory.create({
    userId: req.user._id,
    content: `Debit of ${amount}`,
    type: "debit",
  });
  await TransactionHistory.create({
    userId: sellerAccount._id,
    content: `Credit of ${amount}`,
    type: "credit",
  });

  res.status(200).json({ success: true, message: "Payment made successfully" });
});
