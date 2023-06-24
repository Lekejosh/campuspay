const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
    default: function genUUID() {
      return require("uuid").v4();
    },
  },
  images: [
    {
      type: String,
    },
  ],
  description: {
    type: String,
    maxLength: [1000, "Description can't be more than 1000 Characters"],
  },
  price: {
    type: Number,
  },

  ratings: {
    type: Number,
    default: 0,
  },
  numOfReviews: {
    type: Number,
    default: 0,
  },
  reviews: [
    {
      user: {
        type: String,
        ref: "User",
        required: true,
      },
      rating: {
        type: Number,
        required: true,
      },
      comment: {
        type: String,
        required: true,
      },
      _id: {
        type: String,
        required: true,
        default: function genUUID() {
          return require("uuid").v4();
        },
      },
    },
  ],
  likes: [
    {
      type: String,
      ref: "User",
    },
  ],
  comments: [
    {
      type: String,
      ref: "Comment",
    },
  ],
  pickup: {
    type: Boolean,
  },
  shipping: {
    type: Boolean,
  },
  location: {
    type: String,
  },
  author:{
    type:String,
    ref:"User"
  },
  isNegotiatable:{
    type:Boolean,
    default:false
  }
});


module.exports = mongoose.model("Post",postSchema)