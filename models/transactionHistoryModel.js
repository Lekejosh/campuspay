const mongoose = require("mongoose");
const transactionHistorySchema = new mongoose.Schema(
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
    content: {
      type: String,
    },
    type:{
      type:String,
      enum:['debit','credit','request','create','delete','deposit','withdrawal']
    },
    description:{
      type:String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("TransactionHistory", transactionHistorySchema);
