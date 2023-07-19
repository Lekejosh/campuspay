const mongoose = require("mongoose");
const walletSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
      default: function genUUID() {
        return require("uuid").v4();
      },
    },
    userId: {
      type: String,
      ref: "User",
    },
    currency: {
      type: String,
      default: "NGN",
    },
    balance: {
      type: Number,
      default: 0,
    },
    accountNumber: {
      type: String,
    },
    history: [
      {
        _id: {
          type: String,
          required: true,
          default: function genUUID() {
            return require("uuid").v4();
          },
        },
        content: {
          type: String,
        },
        date: {
          type: Date,
          default: Date.now(),
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Wallet", walletSchema);
