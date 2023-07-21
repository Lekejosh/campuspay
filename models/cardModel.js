const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
      default: function genUUID() {
        return require("uuid").v4();
      },
    },
    user: {
      type: String,
      ref: "User",
    },
    cardNumber: {
      type: String,
      unique: true,
    },
    cardType: {
      type: String,
      enum: ["masterCard", "visa"],
    },
    expiryDate: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Card", cardSchema);
