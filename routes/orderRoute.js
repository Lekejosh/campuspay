const express = require("express");
const router = express.Router();

const {
  createOrder,
  payForOrder,
  getOrder,
  getAllOrder,
  deleteOrder,
} = require("../controllers/orderController");
const { isAuthenticatedUser } = require("../middlewares/auth");

router
  .route("/")
  .post(isAuthenticatedUser, createOrder)
  .get(isAuthenticatedUser, getAllOrder);
router
  .route("/:orderId")
  .put(isAuthenticatedUser, payForOrder)
  .get(isAuthenticatedUser, getOrder)
  .delete(isAuthenticatedUser, deleteOrder);

module.exports = router;
