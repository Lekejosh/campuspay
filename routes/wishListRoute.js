const express = require("express");
const router = express.Router();

const { isAuthenticatedUser } = require("../middlewares/auth");
const {
  getAllWishlist,
  getWishlist,
  deleteWishList,
  deleteItemInWishList,
  renameWishlist,
} = require("../controllers/wishListController");

router.route("/").get(isAuthenticatedUser, getAllWishlist);
router
  .route("/:wishlistId")
  .get(isAuthenticatedUser, getWishlist)
  .put(isAuthenticatedUser, renameWishlist)
  .delete(isAuthenticatedUser, deleteWishList);
router
  .route("/item/:wishlistId")
  .delete(isAuthenticatedUser, deleteItemInWishList);

module.exports = router;
