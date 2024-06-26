const Post = require("../models/postModel");
const User = require("../models/userModel");
const Wishlist = require("../models/wishListModel");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const cloudinary = require("cloudinary");
const ErrorHandler = require("../utils/errorHandler");
const Notification = require("../models/notificationModel");

exports.createPost = catchAsyncErrors(async (req, res, next) => {
  const {
    description,
    price,
    pickup,
    shipping,
    location,
    isNegotiatable,
    category,
  } = req.body;

  const images = [];

  if (!req.files.length) {
    return next(new ErrorHandler("Image fields can't be empty", 422));
  }

  for (const file of req.files) {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "Campus_Pay",
    });
    images.push(result.secure_url);
  }

  const post = await Post.create({
    description,
    images,
    price,
    pickup,
    shipping,
    category,
    location,
    isNegotiatable,
    author: req.user._id,
  });

  res.status(201).json({ success: true, post });
});

exports.getPost = catchAsyncErrors(async (req, res, next) => {
  const postId = req.params.postId;

  if (!postId || postId === ":postId")
    return next(new ErrorHandler("Post Id not specified", 422));

  const post = await Post.findById(postId);

  if (!post) {
    return next(new ErrorHandler("Post not found", 404));
  }

  res.status(200).json({ success: true, post });
});

exports.deletePost = catchAsyncErrors(async (req, res, next) => {
  const postId = req.params.postId;

  if (!postId || postId === ":postId")
    return next(new ErrorHandler("Post Id not specified", 422));

  const post = await Post.findById(postId);

  if (!post) return next(new ErrorHandler("Post not Found", 404));

  if (post.author !== req.user._id)
    return next(
      new ErrorHandler("Unauthorized to delete someone else's Post", 401)
    );

  post.deleteOne();

  res.status(200).json({
    success: true,
    message: "Post deleted succesfully",
  });
});

exports.likePost = catchAsyncErrors(async (req, res, next) => {
  const postId = req.params.postId;
  const { wishListName } = req.body;

  if (!postId || postId === ":postId")
    return next(new ErrorHandler("Post Id not specified", 422));

  const post = await Post.findById(postId);

  if (!post) return next(new ErrorHandler("Post not found", 404));

  post.likes.push(req.user._id);
  await post.save();

  if (!wishListName) {
    var wishList = await Wishlist.findOne({
      user: req.user._id,
      name: "Wishlist",
    });
    if (!wishList) {
      await Wishlist.create({
        name: "Wishlist",
        user: req.user._id,
        items: [{ item: postId }],
      });
    }
  } else {
    var wishlist = await Wishlist.findOne({
      user: req.user._id,
      name: wishListName,
    });
    if (!wishlist) {
      Wishlist.create({
        user: req.user._id,
        name: wishListName,
        items: [{ item: postId }],
      });
    }
    wishlist.items.push({ item: postId });
    await wishlist.save();
  }

  if (post.author !== req.user._id) {
    var notification = await Notification.create({
      type: "like",
      typeId: postId,
      content: `${req.user.username} just liked your post`,
      userId: post.author,
    });
  }
  res.status(200).json({
    success: true,
    message: "Post liked successfully",
    post,
    notification,
  });
});

exports.unlikePost = catchAsyncErrors(async (req, res, next) => {
  const postId = req.params.postId;

  if (!postId || postId === ":postId")
    return next(new ErrorHandler("Post Id not specified", 422));

  const post = await Post.findById(postId);

  if (!post) return next(new ErrorHandler("Post not found", 404));

  const exist = post.likes.find((user) => user.toString() === req.user._id);

  if (!exist)
    return next(new ErrorHandler("User has not liked this post before", 401));

  post.likes = post.likes.filter((user) => user.toString() !== req.user._id);

  await post.save();

  res
    .status(200)
    .json({ success: true, message: "Post Unliked successfully", post });
});

exports.createPostReview = catchAsyncErrors(async (req, res, next) => {
  const postId = req.params.postId;

  if (!postId || postId === ":postId")
    return next(new ErrorHandler("Post Id not specified", 422));
  const { rating, comment } = req.body;

  const review = {
    user: req.user._id,
    rating: Number(rating),
    comment,
  };
  const post = await Post.findById(postId);

  if (!post) {
    return next(new ErrorHandler("Post does not exist", 400));
  }

  if (post.author === req.user._id) {
    return next(new ErrorHandler("The owner of the item can't review", 400));
  }

  const isReviewed = post.reviews.find((rev) => rev.user === req.user._id);

  if (isReviewed) {
    post.reviews.forEach((rev) => {
      if (rev.user === req.user._id)
        (rev.rating = rating), (rev.comment = comment);
    });
  } else {
    post.reviews.push(review);
    post.numOfReviews = post.reviews.length;
  }
  let avg = 0;
  for (const rev of post.reviews) {
    avg += rev.rating;
  }
  post.ratings = avg / post.reviews.length;

  await post.save({ validateBeforeSave: false });

  await Notification.create({
    type: "comment",
    typeId: postId,
    content: `${req.user.username} just made a comment on your post`,
    userId: post.author,
  });

  res.status(201).json({
    success: true,
    message: "Review created succesfully",
  });
});

exports.getPostReviews = catchAsyncErrors(async (req, res, next) => {
  const postId = req.params.postId;

  if (!postId || postId === ":postId")
    return next(new ErrorHandler("Post Id not specified", 422));
  const post = await Post.findById(postId);

  if (!post) {
    return next(new ErrorHandler("Art Not found", 404));
  }

  res.status(200).json({
    success: true,
    data: post.reviews,
  });
});

exports.deletePostReview = catchAsyncErrors(async (req, res, next) => {
  const postId = req.params.postId;
  const reviewId = req.query.review;
  if (!postId || postId === ":postId")
    return next(new ErrorHandler("Post Id not specified", 422));

  const post = await Post.findById(postId);

  if (!post) {
    return next(new ErrorHandler("Post does not exist", 404));
  }

  const reviewToDelete = post.reviews.find((rev) => rev._id === reviewId);

  if (!reviewToDelete) {
    return next(new ErrorHandler("Review not found", 404));
  }

  if (reviewToDelete.user !== req.user._id) {
    return next(new ErrorHandler("Not authorized to delete this review", 403));
  }

  post.reviews = post.reviews.filter((rev) => rev._id !== reviewId);
  post.numOfReviews = post.reviews.length;

  if (post.reviews.length === 0) {
    post.ratings = 0;
  } else {
    let avg = 0;
    for (const rev of post.reviews) {
      avg += rev.rating;
    }
    post.ratings = avg / post.reviews.length;
  }

  await post.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: "Review Deleted Successfully",
  });
});

exports.searchPostByCategory = catchAsyncErrors(async (req, res, next) => {
  const { type, minPrice, maxPrice } = req.query;

  if (!type) {
    return next(new ErrorHandler("Category not specified", 422));
  }

  let query = { category: type };

  if (minPrice && maxPrice) {
    query.price = { $gte: parseFloat(minPrice), $lte: parseFloat(maxPrice) };
  } else if (minPrice) {
    query.price = { $gte: parseFloat(minPrice) };
  } else if (maxPrice) {
    query.price = { $lte: parseFloat(maxPrice) };
  }

  const post = await Post.find(query);

  res.status(200).json({ success: true, post });
});
