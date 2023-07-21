const express = require("express");
const router = express.Router();

const upload = require("../utils/multer");
const {
  createPost,
  deletePost,
  getPost,
  likePost,
  unlikePost,
  createPostReview,
  getPostReviews,
  deletePostReview,
  seearchPostByCategory,
} = require("../controllers/postController");

const {
  isAuthenticatedUser,
  authorizeRole,
  deactivated,
} = require("../middlewares/auth");

router
  .route("/")
  .post(
    isAuthenticatedUser,
    upload.array("images", 5),
    authorizeRole("student", "staff"),
    createPost
  );

router.route("/:postId").get(isAuthenticatedUser, getPost);
router
  .route("/edit/:postId")
  .delete(isAuthenticatedUser, authorizeRole("student", "staff"), deletePost);
router
  .route("/like/:postId")
  .put(isAuthenticatedUser, likePost)
  .delete(isAuthenticatedUser, unlikePost);

router
  .route("/review/:postId")
  .put(isAuthenticatedUser, createPostReview)
  .get((isAuthenticatedUser, getPostReviews))
  .delete(isAuthenticatedUser, deletePostReview);

router
  .route("/search/category")
  .get(isAuthenticatedUser, deactivated, seearchPostByCategory);

module.exports = router;
