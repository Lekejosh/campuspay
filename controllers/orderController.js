const User = require("../models/userModel");
const Order = require("../models/orderModel");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const Notification = require("../models/notificationModel");

exports.createOrder = catchAsyncErrors(async (req, res, next) => {
  const { items, location, amount, tax, totalAmount } = req.body;
  if (!items || !amount || !location || !tax || !totalAmount) {
    return next(new ErrorHandler("All Required Parameters not provided", 422));
  }

  const order = await Order.create({
    items: items,
    amount: amount,
    totalAmount: totalAmount,
    user: req.user._id,
    tax: tax,
  });

  res
    .status(201)
    .json({ success: true, message: "Order Created Successfully", order });
});

exports.payForOrder = catchAsyncErrors(async (req, res, next) => {
  const { orderId } = req.params;
  const { payment } = req.body;

  if (!orderId || !payment)
    return next(new ErrorHandler("All Parmaters is not provided", 422));

  const order = await Order.findById(orderId);

  if (!order) return next(new ErrorHandler("Order not found", 404));
  if (order.user != req.user._id) {
    return next(new ErrorHandler("You didn't make this order", 401));
  }
  order.payment = payment;
  await order.save();

  for (let i = 0; i < order.items.length; i++) {
    await Notification.create({
      type: "order",
      typeId: order._id,
      content: `${req.user.username} just made an Order`,
      userId: order.items[i].seller,
    });
  }

  res
    .status(200)
    .json({ success: true, message: "order for successfully", order });
});

exports.getOrder = catchAsyncErrors(async (req, res, next) => {
  const { orderId } = req.params;

  if (!orderId) {
    return next(new ErrorHandler("Order Id not provided", 422));
  }

  const order = await Order.findById(orderId);

  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }
  if (order.user != req.user._id) {
    return next(new ErrorHandler("You didn't make this order", 401));
  }

  res.status(200).json({ success: true, order });
});

exports.getAllOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.find({ user: req.user._id });

  if (!order.length) {
    return res.status(200).json({ success: true, message: "No Order found" });
  }

  res.status(200).json({ success: true, order });
});

exports.deleteOrder = catchAsyncErrors(async (req, res, next) => {
  const { orderId } = req.params;

  if (!orderId) {
    return next(new ErrorHandler("Order Id not provided", 422));
  }

  const order = await Order.findById(orderId);

  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }

  if (order.user != req.user._id)
    return next(new ErrorHandler("You didn't create this order"));

  if (Order.payment.status == "paid") {
    return next(new ErrorHandler("You can't delete an already paid order"));
  }

  Order.deleteOne();

  res
    .status(200)
    .json({ success: true, message: "Order Deleted Successfully" });
});

exports.deliverOrder = catchAsyncErrors(async(req,res,next)=>{
    const {orderId} = req.params

    const order = await Order.findById(orderId)

    if(!order){
      return next(new ErrorHandler("Order not found",404))
    }
})