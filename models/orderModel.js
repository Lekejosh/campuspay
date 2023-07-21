const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
      default: function genUUID() {
        return require("uuid").v4();
      },
    },
    location: {
      postalCode: String,
      country: String,
      state: String,
      houseAddress: String,
    },
    payment: {
      status: {
        type: String,
        enum: ["paid", "fail", "processing"],
        default: "processing",
      },
      refrence: String,
    },
    items: 
      {
        seller: {
          type: String,
          ref: "User",
        },
        itemId: {
          type: String,
          ref: "Post",
        },
        isDelivered: {
          type: Boolean,
          default: false,
        },
        price: Number,
        quantity: Number,
        size: String,
        _id: {
          type: String,
          required: true,
          default: function genUUID() {
            return require("uuid").v4();
          },
        },
      },
    amount: {
      type: Number,
    },
    tax: {
      type: Number,
    },
    totalAmount: {
      type: Number,
    },
    isDelivered: {
      type: Boolean,
      default: false,
    },
    user: {
      type: String,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
