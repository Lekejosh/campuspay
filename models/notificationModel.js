const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
      default: function genUUID() {
        return require("uuid").v4();
      },
    },
    type: {
      type: String,
      enum: ["like", "comment", "mention", "order"],
    },
    typeId: {
      type: String,
    },
    content: {
      type: String,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: String,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Notification", notificationSchema);
