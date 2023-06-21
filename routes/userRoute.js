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
} = require("../controllers/userController");

const { isAuthenticatedUser, deactivated } = require("../middlewares/auth");
const { route } = require("../app");

router.route("/").post(registerUser);
router.route("/login").post(loginUser);
router.route('/logout').get(isAuthenticatedUser,logoutUser)
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
module.exports = router;
