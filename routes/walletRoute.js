const express = require("express");
const router = express.Router();
const {
  createWallet,
  getWallet,
  getAllWallet,
  deleteWallet,
  transferToWallet,
  depositIntoWallet,
  changeTransactionPin,
  createTransactionPin,
  getSecurityQuestion,
  requestPayment,
  withdrawMoney,
  depositIntoMainAccount,
  payForOrder,
} = require("../controllers/walletController");
const { isAuthenticatedUser, deactivated } = require("../middlewares/auth");

router.route("/create").post(isAuthenticatedUser, deactivated, createWallet);
router
  .route("/:accountNumber")
  .get(isAuthenticatedUser, deactivated, getWallet)
  .delete(isAuthenticatedUser, deactivated, deleteWallet);
router
  .route("/deposit")
  .post(isAuthenticatedUser, deactivated, depositIntoWallet);
router
  .route("/deposit/main")
  .post(isAuthenticatedUser, deactivated, depositIntoMainAccount);
router.route("/withdraw").post(isAuthenticatedUser, deactivated, withdrawMoney);
router.route("/").get(isAuthenticatedUser, deactivated, getAllWallet);
router
  .route("/transfer")
  .post(isAuthenticatedUser, deactivated, transferToWallet);
router.route("/request").post(isAuthenticatedUser, deactivated, requestPayment);
router
  .route("/transaction-pin/change")
  .put(isAuthenticatedUser, deactivated, changeTransactionPin);
router
  .route("/transaction-pin/create")
  .post(isAuthenticatedUser, deactivated, createTransactionPin);
router
  .route("/transaction-pin/security")
  .get(isAuthenticatedUser, deactivated, getSecurityQuestion);
router.route("/order/pay").post(isAuthenticatedUser, deactivated, payForOrder);

module.exports = router;
