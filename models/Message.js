const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  senderRole: {
    type: String,
    enum: ["patient", "doctor"],
    required: true,
  },
  type: {
    type: String,
    enum: ["text", "prescription"],
    default: "text",
  },
  content: { type: String, default: "" },
  prescriptionUrl: { type: String },
  prescriptionFileName: { type: String },
  createdAt: { type: Date, default: Date.now },
});

messageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);
