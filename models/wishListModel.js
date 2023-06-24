const mongoose = require("mongoose");

const wishListSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
      default: function genUUID() {
        return require("uuid").v4();
      },
    },
    name: {
      type: String,
      default: "Wishlist",
    },
    items: [
      {
        item: {
          type: String,
          ref: "Post",
        },
        timestamp: {
          type: Date,
          default: Date.now,
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
    user: {
      type: String,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Wishlist", wishListSchema);
