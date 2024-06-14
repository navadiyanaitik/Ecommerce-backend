const Order = require("../model/order");
const Product = require("../model/product");
const dbService = require("../utils/dbService");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncError");

exports.createOrder = catchAsyncErrors(async (req, res, next) => {
  const {
    shippingInfo,
    orderItems,
    paymentInfo,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body;

  const order = await dbService.create(Order, {
    shippingInfo,
    orderItems,
    paymentInfo,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paidAt: Date.now(),
    user: req.user._id,
  });

  res.status(201).json({
    success: true,
    order,
  });
});

// get order details

exports.getOrderDetails = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email"
  );
  if (!order) {
    next(new ErrorHandler("Order not found with this id", 404));
  }
  res.status(200).json({ success: true, order });
});

// my orders

exports.myOrders = catchAsyncErrors(async (req, res, next) => {
  const orders = await dbService.findMany(Order, { user: req.user._id });
  res.status(200).json({ success: true, orders });
});

exports.getAllOrders = catchAsyncErrors(async (req, res, next) => {
  const orders = await dbService.findMany(Order);
  let totalAmount = 0;
  orders.forEach((ordr) => {
    totalAmount += ordr.totalPrice;
  });
  res.status(200).json({ success: true, orders, totalAmount });
});

exports.updateOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (order.orderStatus === "Delivered") {
    return next(new ErrorHandler("You have already delivered this order", 400));
  }
  order.orderItems.forEach(async (item) => {
    await updateStock(item.product, item.quantity);
  });

  order.orderStatus = req.body.status;
  if ((req.body.status = "Delivered")) {
    order.deliveredAt = Date.now();
  }
  await order.save({ validateBeforeSave: false });

  res.status(201).json({ success: true });
});

async function updateStock(id, quantiy) {
  const product = await Product.findById(id);
  if (!product) {
    return next(new ErrorHandler("Product not found!"));
  }
  product.stock -= quantiy;
  await product.save({ validateBeforeSave: false });
}

exports.deleteOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    next(new ErrorHandler("Order not found with this id", 404));
  }
  await order.deleteOne();
  res.status(200).json({ success: true });
});
