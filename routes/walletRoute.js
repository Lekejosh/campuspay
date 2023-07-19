const express = require("express");
const router = express.Router();
const {
  createWallet,
  getWallet,
  getAllWallet,
  deleteWallet,
  transferToWallet,
  depositIntoWallet,
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
router.route("/").get(isAuthenticatedUser, deactivated, getAllWallet);
router
  .route("/transfer")
  .post(isAuthenticatedUser, deactivated, transferToWallet);

module.exports = router;
