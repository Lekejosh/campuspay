const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  verifyEmail,
  resendOtp,
  logoutUser,
  changeUsername,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
  updatePassword,
  updateRoleToStudentOrStaff,
  deleteAccount,
  bvn,
} = require("../controllers/userController");

const { isAuthenticatedUser, deactivated } = require("../middlewares/auth");

router.route("/").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").get(isAuthenticatedUser, logoutUser);
router
  .route("/verify")
  .put(isAuthenticatedUser, verifyEmail)
  .get(isAuthenticatedUser, resendOtp);

router
  .route("/update/username")
  .put(isAuthenticatedUser, deactivated, changeUsername);
router
  .route("/me")
  .get(isAuthenticatedUser, deactivated, getMe)
  .put(isAuthenticatedUser, deactivated, updateProfile);

router.route("/password/forgot").get(forgotPassword);
router.route("/password/reset/:token").put(resetPassword);
router
  .route("/update/password")
  .put(isAuthenticatedUser, deactivated, updatePassword);

router
  .route("/update/role")
  .put(isAuthenticatedUser, deactivated, updateRoleToStudentOrStaff);

router.route("/verify/bvn").post(isAuthenticatedUser, deactivated, bvn);
router
  .route("/account/security/delete")
  .delete(isAuthenticatedUser, deleteAccount);
module.exports = router;
